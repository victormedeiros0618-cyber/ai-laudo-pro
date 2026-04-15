import { useState, useCallback } from 'react';
import type { RelatorioIA, AchadoTecnico } from '@/types';

// ============ TIPOS ============
export interface Foto {
    id: string;
    file: File;
    preview: string;
    loading: boolean;
    error: string | null;
    analise?: RelatorioIA;
    analiseGemini?: RelatorioIA;
}

// ============ HOOK: useFotoManager ============
export function useFotoManager() {
    const [fotos, setFotos] = useState<Foto[]>([]);

    // ============ ADICIONAR FOTO ============
    const adicionarFoto = useCallback((file: File) => {
        // ✅ VALIDAR TIPO DE ARQUIVO
        if (!file.type.startsWith('image/')) {
            console.error('🔴 Arquivo não é uma imagem:', file.type);
            return null;
        }

        // ✅ VALIDAR TAMANHO (máx 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            console.error('🔴 Arquivo muito grande:', file.size);
            return null;
        }

        // ✅ GERAR ID ÚNICO
        const id = `foto-${Date.now()}-${Math.random()}`;

        // ✅ GERAR PREVIEW
        const preview = URL.createObjectURL(file);

        // ✅ CRIAR OBJETO FOTO
        const novaFoto: Foto = {
            id,
            file,
            preview,
            loading: false,
            error: null,
            analise: undefined,
            analiseGemini: undefined,
        };

        // ✅ ADICIONAR À LISTA
        setFotos((prev) => [...prev, novaFoto]);

        console.log('🟢 Foto adicionada:', id);
        return novaFoto;
    }, []);

    // ============ REMOVER FOTO ============
    const removerFoto = useCallback((fotoId: string) => {
        setFotos((prev) => {
            const foto = prev.find((f) => f.id === fotoId);

            // ✅ LIMPAR PREVIEW (liberar memória)
            if (foto && foto.preview) {
                URL.revokeObjectURL(foto.preview);
            }

            return prev.filter((f) => f.id !== fotoId);
        });

        console.log('🟢 Foto removida:', fotoId);
    }, []);

    // ============ ATUALIZAR ANÁLISE GEMINI ============
    const atualizarAnaliseGemini = useCallback(
        (fotoId: string, analise: RelatorioIA) => {
            setFotos((prev) =>
                prev.map((f) =>
                    f.id === fotoId
                        ? { ...f, analiseGemini: analise, loading: false, error: null }
                        : f
                )
            );

            console.log('🟢 Análise Gemini atualizada para:', fotoId);
        },
        []
    );

    // ============ ATUALIZAR LOADING ============
    const atualizarLoading = useCallback((fotoId: string, loading: boolean) => {
        setFotos((prev) =>
            prev.map((f) =>
                f.id === fotoId ? { ...f, loading } : f
            )
        );
    }, []);

    // ============ ATUALIZAR ERRO ============
    const atualizarErro = useCallback((fotoId: string, erro: string | null) => {
        setFotos((prev) =>
            prev.map((f) =>
                f.id === fotoId ? { ...f, error: erro, loading: false } : f
            )
        );

        if (erro) {
            console.error('🔴 Erro na foto:', fotoId, erro);
        }
    }, []);

    // ============ LIMPAR TODAS AS FOTOS ============
    const limparTodas = useCallback(() => {
        fotos.forEach((foto) => {
            if (foto.preview) {
                URL.revokeObjectURL(foto.preview);
            }
        });

        setFotos([]);
        console.log('🟢 Todas as fotos foram removidas');
    }, [fotos]);

    // ============ OBTER FOTOS COM ANÁLISE ============
    const fotosComAnalise = useCallback(() => {
        return fotos.filter((f) => f.analiseGemini);
    }, [fotos]);

    // ============ OBTER FOTOS SEM ANÁLISE ============
    const fotosSemAnalise = useCallback(() => {
        return fotos.filter((f) => !f.analiseGemini && !f.loading);
    }, [fotos]);

    // ============ OBTER FOTOS CARREGANDO ============
    const fotosCarregando = useCallback(() => {
        return fotos.filter((f) => f.loading);
    }, [fotos]);

    // ============ CONSOLIDAR TODAS AS ANÁLISES ============
    const consolidarAnalises = useCallback((): RelatorioIA | null => {
        const fotosAnalisadas = fotosComAnalise();

        if (fotosAnalisadas.length === 0) {
            return null;
        }

        const todasAsAnalises: AchadoTecnico[] = [];
        let nivelRiscoGeral: 'baixo' | 'medio' | 'alto' | 'critico' = 'baixo';
        let resumoGeral = '';

        fotosAnalisadas.forEach((foto) => {
            if (!foto.analiseGemini) return;

            // ✅ CONSOLIDAR ACHADOS
            todasAsAnalises.push(...foto.analiseGemini.achados);
            resumoGeral += `\n${foto.analiseGemini.resumo_executivo}`;

            // ✅ ATUALIZAR NÍVEL DE RISCO GERAL
            const niveis = ['baixo', 'medio', 'alto', 'critico'];
            const indexAtual = niveis.indexOf(nivelRiscoGeral);
            const indexNovo = niveis.indexOf(foto.analiseGemini.nivel_risco_geral);
            if (indexNovo > indexAtual) {
                nivelRiscoGeral = foto.analiseGemini.nivel_risco_geral;
            }
        });

        const resultadoFinal: RelatorioIA = {
            achados: todasAsAnalises,
            resumo_executivo: `Análise consolidada de ${fotosAnalisadas.length} foto(s). Total de ${todasAsAnalises.length} achado(s) encontrado(s).${resumoGeral}`,
            nivel_risco_geral: nivelRiscoGeral,
        };

        console.log('🟢 Análises consolidadas:', resultadoFinal);
        return resultadoFinal;
    }, [fotosComAnalise]);

    // ============ RETORNAR HOOK ============
    return {
        // Estado
        fotos,

        // Funções de manipulação
        adicionarFoto,
        removerFoto,
        atualizarAnaliseGemini,
        atualizarLoading,
        atualizarErro,
        limparTodas,

        // Funções de consulta
        fotosComAnalise,
        fotosSemAnalise,
        fotosCarregando,
        consolidarAnalises,

        // Estatísticas
        totalFotos: fotos.length,
        totalAnalisadas: fotosComAnalise().length,
        totalCarregando: fotosCarregando().length,
        totalComErro: fotos.filter((f) => f.error).length,
    };
}