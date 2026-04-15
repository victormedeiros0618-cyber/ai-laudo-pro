import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { RelatorioIA } from '@/types';
import { getInstrucaoExtra } from '@/lib/laudoPrompts';

export function useAnaliseLaudo() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

                
                toast.loading(`Analisando ${fotos.length} fotos com IA...`);

                // ✅ CONVERTER FOTOS PARA BASE64
                const images: Array<{ id: string; imageBase64: string }> = [];

                for (const foto of fotos) {
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            try {
                                const result = reader.result as string;
                                resolve(result.includes(',') ? result.split(',')[1] : result);
                            } catch (err) {
                                reject(err);
                            }
                        };
                        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                        reader.readAsDataURL(foto.file);
                    });

                    images.push({ id: foto.id, imageBase64: base64 });
                }

                

                // ✅ OBTER TOKEN JWT REAL DO USUÁRIO
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('Sessão expirada. Faça login novamente.');
                }

                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                if (!supabaseUrl) {
                    throw new Error('Variáveis de ambiente Supabase não configuradas');
                }

                

                // ✅ CHAMADA COM TIMEOUT + RETRY (exponential backoff)
                const TIMEOUT_MS = 90_000; // 90s — análise de imagens pode demorar
                const MAX_RETRIES = 2;

                async function fetchWithRetry(attempt: number): Promise<Response> {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                    try {
                        const res = await fetch(
                            `${supabaseUrl}/functions/v1/gemini-analyze`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify({
                                    images,
                                    tipoLaudo,
                                    laudoId,
                                    descricao,
                                    instrucoesExtra: getInstrucaoExtra(tipoLaudo),
                                }),
                                signal: controller.signal,
                            }
                        );
                        clearTimeout(timeoutId);

                        // Retry em erros de servidor (502, 503, 504) ou rate limit (429)
                        if ((res.status >= 500 || res.status === 429) && attempt < MAX_RETRIES) {
                            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
                            console.warn('[useAnaliseLaudo] Tentativa', attempt + 1, 'falhou', res.status, '- retentando em', delay + 'ms');
                            await new Promise(r => setTimeout(r, delay));
                            return fetchWithRetry(attempt + 1);
                        }

                        return res;
                    } catch (err) {
                        clearTimeout(timeoutId);
                        if (err instanceof DOMException && err.name === 'AbortError') {
                            if (attempt < MAX_RETRIES) {
                                const delay = Math.pow(2, attempt) * 1000;
                                console.warn('[useAnaliseLaudo] Timeout na tentativa', attempt + 1, '- retentando em', delay + 'ms');
                                await new Promise(r => setTimeout(r, delay));
                                return fetchWithRetry(attempt + 1);
                            }
                            throw new Error('Tempo limite excedido. A análise demorou mais que o esperado. Tente com menos fotos.');
                        }
                        throw err;
                    }
                }

                const response = await fetchWithRetry(0);

                

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('[useAnaliseLaudo] Erro da Edge Function:', errorData);
                    throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
                }

                const result: {
                    achados: Array<{
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
                    }>;
                    resumo_executivo: string;
                    nivel_risco_geral: string;
                } = await response.json();

                

                // ✅ AGRUPAR ACHADOS POR FOTO_ID
                const resultadosMap = new Map<string, RelatorioIA | null>();

                // Inicializar todas as fotos como sem resultado
                for (const img of images) {
                    resultadosMap.set(img.id, null);
                }

                // Agrupar achados por foto_id
                const achadosPorFoto = new Map<string, typeof result.achados>();
                for (const achado of result.achados) {
                    const fotoId = achado.foto_id;
                    if (!achadosPorFoto.has(fotoId)) {
                        achadosPorFoto.set(fotoId, []);
                    }
                    achadosPorFoto.get(fotoId)!.push(achado);
                }

                // Montar RelatorioIA por foto
                for (const [fotoId, achados] of achadosPorFoto) {
                    const relatorio: RelatorioIA = {
                        achados: achados.map((a) => ({
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
                        })),
                        resumo_executivo: result.resumo_executivo,
                        nivel_risco_geral: result.nivel_risco_geral as RelatorioIA['nivel_risco_geral'],
                    };
                    resultadosMap.set(fotoId, relatorio);
                    
                }

                // Fotos sem achados recebem relatório vazio (sem patologia)
                for (const img of images) {
                    if (!achadosPorFoto.has(img.id)) {
                        resultadosMap.set(img.id, {
                            achados: [],
                            resumo_executivo: 'Nenhuma patologia identificada nesta imagem.',
                            nivel_risco_geral: 'baixo',
                        });
                        
                    }
                }

                const totalComAchados = [...achadosPorFoto.keys()].length;
                toast.success(`Análise concluída! ${totalComAchados}/${images.length} fotos com achados`);

                return resultadosMap;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
                console.error('[useAnaliseLaudo] Erro na análise:', errorMessage);
                setError(errorMessage);
                toast.error(`Erro ao analisar fotos: ${errorMessage}`);
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
        analisarLote,
    };
}