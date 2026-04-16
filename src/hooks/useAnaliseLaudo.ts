import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { RelatorioIA } from '@/types';
import { getInstrucaoExtra } from '@/lib/laudoPrompts';

/**
 * Tipos de resposta da Edge Function gemini-analyze.
 * Cada análise retorna achados de 1 foto + resumo e nível de risco *daquela* análise.
 * No modo foto-por-foto, o hook agrega resumo/nível após todas as respostas.
 */
interface AchadoRaw {
    foto_id: string;
    ambiente_setor: string;
    titulo_patologia: string;
    descricao_tecnica: string;
    gravidade: string;
    nota_g: number;
    nota_u: number;
    nota_t: number;
    gut_score: number;
    estimativa_custo: string;
    norma_nbr_relacionada: string;
    provavel_causa: string;
    recomendacao_intervencao: string;
}

interface AnalyzeResponseRaw {
    achados: AchadoRaw[];
    resumo_executivo: string;
    nivel_risco_geral: string;
}

export interface ProgressoAnalise {
    atual: number;
    total: number;
    status: 'idle' | 'analisando' | 'done' | 'error';
}

// Ordem para agregação do nível de risco geral (pega o máximo entre respostas)
const NIVEIS_RISCO_ORDEM: Record<string, number> = {
    baixo: 0,
    medio: 1,
    alto: 2,
    critico: 3,
};

const NIVEIS_RISCO_REVERSO = ['baixo', 'medio', 'alto', 'critico'] as const;

// Concorrência máxima de requests simultâneas à Edge Function.
// Mantém baixo o risco de rate-limit no Gemini Flash e não sobrecarrega o gateway.
const POOL_CONCURRENCY = 3;

// Timeout por foto individual (análise de 1 imagem deve ser rápida)
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

/**
 * Pool de concorrência simples sem libs externas.
 * Processa `items` com no máximo `concorrencia` workers em paralelo.
 * Preserva a ordem no array de resultados (índice bate com o índice do item).
 */
async function processarEmPool<T, R>(
    items: T[],
    concorrencia: number,
    handler: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
    const resultados: R[] = new Array(items.length);
    let nextIdx = 0;

    const workers = Array.from({ length: Math.min(concorrencia, items.length) }, async () => {
        while (true) {
            const idx = nextIdx++;
            if (idx >= items.length) return;
            resultados[idx] = await handler(items[idx], idx);
        }
    });

    await Promise.all(workers);
    return resultados;
}

export function useAnaliseLaudo() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progresso, setProgresso] = useState<ProgressoAnalise>({
        atual: 0,
        total: 0,
        status: 'idle',
    });

    // Ref para não recriar o callback quando só o progresso muda
    const progressoRef = useRef(progresso);
    progressoRef.current = progresso;

    const analisarLote = useCallback(
        async (
            fotos: Array<{ id: string; file: File | Blob }>,
            tipoLaudo: string,
            laudoId?: string,
            descricao?: string
        ): Promise<Map<string, RelatorioIA | null>> => {
            try {
                setLoading(true);
                setError(null);

                if (fotos.length === 0) {
                    throw new Error('Nenhuma foto para analisar');
                }

                const total = fotos.length;
                setProgresso({ atual: 0, total, status: 'analisando' });

                // ============ CONVERTER FOTOS PARA BASE64 (em paralelo) ============
                const images: Array<{ id: string; imageBase64: string }> = await Promise.all(
                    fotos.map(
                        (foto) =>
                            new Promise<{ id: string; imageBase64: string }>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => {
                                    try {
                                        const result = reader.result as string;
                                        const base64 = result.includes(',') ? result.split(',')[1] : result;
                                        resolve({ id: foto.id, imageBase64: base64 });
                                    } catch (err) {
                                        reject(err);
                                    }
                                };
                                reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                                reader.readAsDataURL(foto.file);
                            })
                    )
                );

                // ============ OBTER TOKEN JWT ============
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('Sessão expirada. Faça login novamente.');
                }
                const token = session.access_token;

                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                if (!supabaseUrl) {
                    throw new Error('Variáveis de ambiente Supabase não configuradas');
                }

                // ============ TOAST DE PROGRESSO ============
                const toastId = toast.loading(`Analisando 0/${total} fotos...`);

                // Contador compartilhado (incrementado dentro do pool)
                let concluidas = 0;

                // ============ HANDLER POR FOTO ============
                const instrucoesExtra = getInstrucaoExtra(tipoLaudo);

                async function analisarFotoUnica(
                    image: { id: string; imageBase64: string }
                ): Promise<AnalyzeResponseRaw | null> {
                    const body = JSON.stringify({
                        images: [image],
                        tipoLaudo,
                        laudoId,
                        descricao,
                        instrucoesExtra,
                    });

                    async function fetchComRetry(attempt: number): Promise<Response> {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                        try {
                            const res = await fetch(`${supabaseUrl}/functions/v1/gemini-analyze`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body,
                                signal: controller.signal,
                            });
                            clearTimeout(timeoutId);

                            // Retry em 5xx ou 429, com backoff exponencial (1s, 2s)
                            if ((res.status >= 500 || res.status === 429) && attempt < MAX_RETRIES) {
                                const delay = Math.pow(2, attempt) * 1000;
                                console.warn(
                                    `[useAnaliseLaudo] foto ${image.id} tentativa ${attempt + 1} falhou (${res.status}) — retentando em ${delay}ms`
                                );
                                await new Promise((r) => setTimeout(r, delay));
                                return fetchComRetry(attempt + 1);
                            }

                            return res;
                        } catch (err) {
                            clearTimeout(timeoutId);
                            if (err instanceof DOMException && err.name === 'AbortError' && attempt < MAX_RETRIES) {
                                const delay = Math.pow(2, attempt) * 1000;
                                console.warn(
                                    `[useAnaliseLaudo] foto ${image.id} timeout na tentativa ${attempt + 1} — retentando em ${delay}ms`
                                );
                                await new Promise((r) => setTimeout(r, delay));
                                return fetchComRetry(attempt + 1);
                            }
                            throw err;
                        }
                    }

                    try {
                        const response = await fetchComRetry(0);

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            console.error(
                                `[useAnaliseLaudo] foto ${image.id} erro ${response.status}:`,
                                errorData
                            );
                            return null;
                        }

                        const data = (await response.json()) as AnalyzeResponseRaw;
                        return data;
                    } catch (err) {
                        console.error(`[useAnaliseLaudo] foto ${image.id} erro inesperado:`, err);
                        return null;
                    }
                }

                // ============ PROCESSAR EM POOL ============
                const respostas = await processarEmPool(images, POOL_CONCURRENCY, async (img) => {
                    const data = await analisarFotoUnica(img);
                    concluidas++;
                    setProgresso({ atual: concluidas, total, status: 'analisando' });
                    toast.loading(`Analisando ${concluidas}/${total} fotos...`, { id: toastId });
                    return { fotoId: img.id, data };
                });

                // ============ AGREGAÇÃO DE RESUMO E NÍVEL DE RISCO ============
                const respostasValidas = respostas.filter((r) => r.data !== null) as Array<{
                    fotoId: string;
                    data: AnalyzeResponseRaw;
                }>;

                const nivelRiscoAgregado = respostasValidas.length > 0
                    ? NIVEIS_RISCO_REVERSO[
                        Math.max(
                            ...respostasValidas.map(
                                (r) => NIVEIS_RISCO_ORDEM[r.data.nivel_risco_geral] ?? 0
                            )
                        )
                    ]
                    : 'baixo';

                const resumoAgregado = respostasValidas
                    .map((r) => r.data.resumo_executivo)
                    .filter((s) => s && s.trim().length > 0)
                    .map((s) => `• ${s}`)
                    .join('\n') || 'Nenhuma análise concluída.';

                // ============ MONTAR MAP DE RELATÓRIOS ============
                const resultadosMap = new Map<string, RelatorioIA | null>();

                // Inicializa todas as fotos (incluindo as que falharam) como null
                for (const img of images) {
                    resultadosMap.set(img.id, null);
                }

                // Para cada resposta válida, monta RelatorioIA da foto correspondente
                for (const { fotoId, data } of respostasValidas) {
                    // A edge function pode retornar achados cujo foto_id bate com o id enviado
                    // (esperado) ou, ocasionalmente, um id qualquer — agrupamos por fotoId
                    // do request já que enviamos 1 foto por vez.
                    const achadosFoto = data.achados.filter(
                        (a) => a.foto_id === fotoId || data.achados.length === 1
                    );

                    const achadosNormalizados = (achadosFoto.length > 0 ? achadosFoto : data.achados).map((a) => ({
                        ambiente_setor: a.ambiente_setor,
                        titulo_patologia: a.titulo_patologia,
                        descricao_tecnica: a.descricao_tecnica,
                        gravidade: a.gravidade as RelatorioIA['nivel_risco_geral'],
                        nota_g: a.nota_g,
                        nota_u: a.nota_u,
                        nota_t: a.nota_t,
                        gut_score: a.gut_score,
                        estimativa_custo: a.estimativa_custo,
                        norma_nbr_relacionada: a.norma_nbr_relacionada,
                        provavel_causa: a.provavel_causa,
                        recomendacao_intervencao: a.recomendacao_intervencao,
                    }));

                    const relatorio: RelatorioIA = {
                        achados: achadosNormalizados,
                        // Resumo e nível de risco agregados são compartilhados entre todas as fotos
                        resumo_executivo: resumoAgregado,
                        nivel_risco_geral: nivelRiscoAgregado as RelatorioIA['nivel_risco_geral'],
                    };

                    resultadosMap.set(fotoId, relatorio);
                }

                // Fotos que responderam mas sem achados recebem relatório vazio
                for (const { fotoId, data } of respostasValidas) {
                    if (data.achados.length === 0) {
                        resultadosMap.set(fotoId, {
                            achados: [],
                            resumo_executivo: resumoAgregado,
                            nivel_risco_geral: nivelRiscoAgregado as RelatorioIA['nivel_risco_geral'],
                        });
                    }
                }

                // ============ TOAST FINAL ============
                const falhas = total - respostasValidas.length;
                const sucessos = respostasValidas.length;

                toast.dismiss(toastId);

                if (falhas === 0) {
                    toast.success(`Análise concluída! ${sucessos} foto${sucessos !== 1 ? 's' : ''} analisada${sucessos !== 1 ? 's' : ''}.`);
                    setProgresso({ atual: total, total, status: 'done' });
                } else if (sucessos === 0) {
                    toast.error('Todas as fotos falharam. Verifique sua conexão e tente novamente.');
                    setProgresso({ atual: concluidas, total, status: 'error' });
                    throw new Error('Todas as fotos falharam na análise.');
                } else {
                    toast.warning(
                        `${sucessos}/${total} fotos analisadas. ${falhas} falhou${falhas !== 1 ? 'ram' : ''} — tente reanalizar depois.`
                    );
                    setProgresso({ atual: total, total, status: 'done' });
                }

                return resultadosMap;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
                console.error('[useAnaliseLaudo] Erro na análise:', errorMessage);
                setError(errorMessage);
                setProgresso((prev) => ({ ...prev, status: 'error' }));
                // Só mostra toast genérico se não tiver sido mostrado antes
                if (!errorMessage.includes('Todas as fotos falharam')) {
                    toast.error(`Erro ao analisar fotos: ${errorMessage}`);
                }
                return new Map();
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return {
        loading,
        error,
        progresso,
        analisarLote,
    };
}
