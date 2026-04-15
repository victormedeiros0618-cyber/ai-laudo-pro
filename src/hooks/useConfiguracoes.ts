import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Vistoriador {
    id: string;
    nome: string;
    cargo: string;
    crea_cau: string;
}

export interface Configuracoes {
    id: string;
    user_id: string;
    cor_primaria: string;
    texto_metodologia: string;
    texto_conclusao: string;
    vistoriadores: Vistoriador[];
    logo_url?: string;
    assinatura_url?: string;
    updated_at: string;
}

interface UpdateConfiguracoes {
    cor_primaria?: string;
    texto_metodologia?: string;
    texto_conclusao?: string;
    vistoriadores?: Vistoriador[];
    logo_url?: string;
    assinatura_url?: string;
}

export function useConfiguracoes() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Auto-save timer
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ============ CARREGAR CONFIGURAÇÕES ============
    const carregarConfiguracoes = useCallback(async () => {
        if (!user) {
            setError('Usuário não autenticado');
            return null;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('configuracoes')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (err && err.code !== 'PGRST116') {
                console.error('🔴 Erro ao carregar configurações:', err);
                setError(err.message);
                toast.error('Erro ao carregar configurações');
                return null;
            }

            if (data) {
                console.log('🟢 Configurações carregadas');
                setConfiguracoes(data as Configuracoes);
                return data as Configuracoes;
            }

            // Se não existe, criar padrão
            console.log('🟡 Configurações não encontradas, criando padrão...');
            return null;
        } catch (err) {
            console.error('🔴 Erro:', err);
            setError('Erro ao carregar configurações');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // ============ AUTO-SAVE COM DEBOUNCE ============
    const autoSave = useCallback(
        async (data: UpdateConfiguracoes) => {
            if (!user) {
                console.warn('🟡 Auto-save: Usuário não autenticado');
                return false;
            }

            try {
                setSaveStatus('saving');

                const { error: err } = await supabase
                    .from('configuracoes')
                    .upsert(
                        {
                            user_id: user.id,
                            ...data,
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict: 'user_id',
                        }
                    );

                if (err) {
                    console.error('🔴 Erro ao salvar:', err);
                    setSaveStatus('error');
                    toast.error(`Erro ao salvar: ${err.message}`);
                    return false;
                }

                setSaveStatus('saved');
                console.log('🟢 Configurações salvas');

                // Atualizar estado local
                setConfiguracoes((prev) =>
                    prev
                        ? {
                            ...prev,
                            ...data,
                            updated_at: new Date().toISOString(),
                        }
                        : null
                );

                setTimeout(() => setSaveStatus('idle'), 2000);
                return true;
            } catch (err) {
                console.error('🔴 Erro:', err);
                setSaveStatus('error');
                toast.error('Erro ao salvar configurações');
                return false;
            }
        },
        [user]
    );

    // ============ ATUALIZAR COM DEBOUNCE ============
    const atualizarComDebounce = useCallback(
        (data: UpdateConfiguracoes) => {
            // Limpar timer anterior
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            // Novo timer (aguarda 1s após última mudança)
            saveTimerRef.current = setTimeout(() => {
                autoSave(data);
            }, 1000);
        },
        [autoSave]
    );

    // ============ ATUALIZAR COR PRIMÁRIA ============
    const atualizarCorPrimaria = useCallback(
        (cor: string) => {
            setConfiguracoes((prev) =>
                prev ? { ...prev, cor_primaria: cor } : null
            );
            atualizarComDebounce({ cor_primaria: cor });
        },
        [atualizarComDebounce]
    );

    // ============ ATUALIZAR METODOLOGIA ============
    const atualizarMetodologia = useCallback(
        (texto: string) => {
            setConfiguracoes((prev) =>
                prev ? { ...prev, texto_metodologia: texto } : null
            );
            atualizarComDebounce({ texto_metodologia: texto });
        },
        [atualizarComDebounce]
    );

    // ============ ATUALIZAR CONCLUSÃO ============
    const atualizarConclusao = useCallback(
        (texto: string) => {
            setConfiguracoes((prev) =>
                prev ? { ...prev, texto_conclusao: texto } : null
            );
            atualizarComDebounce({ texto_conclusao: texto });
        },
        [atualizarComDebounce]
    );

    // ============ ADICIONAR VISTORIADOR ============
    const adicionarVistoriador = useCallback(
        async (vistoriador: Vistoriador) => {
            if (!configuracoes) {
                toast.error('Carregue as configurações primeiro');
                return false;
            }

            try {
                const novaLista = [...configuracoes.vistoriadores, vistoriador];
                setConfiguracoes((prev) =>
                    prev ? { ...prev, vistoriadores: novaLista } : null
                );

                const success = await autoSave({ vistoriadores: novaLista });
                if (success) {
                    toast.success('Vistoriador adicionado!');
                }
                return success;
            } catch (err) {
                console.error('🔴 Erro:', err);
                toast.error('Erro ao adicionar vistoriador');
                return false;
            }
        },
        [configuracoes, autoSave]
    );

    // ============ REMOVER VISTORIADOR ============
    const removerVistoriador = useCallback(
        async (id: string) => {
            if (!configuracoes) {
                toast.error('Carregue as configurações primeiro');
                return false;
            }

            try {
                const novaLista = configuracoes.vistoriadores.filter(
                    (v) => v.id !== id
                );
                setConfiguracoes((prev) =>
                    prev ? { ...prev, vistoriadores: novaLista } : null
                );

                const success = await autoSave({ vistoriadores: novaLista });
                if (success) {
                    toast.success('Vistoriador removido!');
                }
                return success;
            } catch (err) {
                console.error('🔴 Erro:', err);
                toast.error('Erro ao remover vistoriador');
                return false;
            }
        },
        [configuracoes, autoSave]
    );

    // ============ ATUALIZAR LOGO ============
    const atualizarLogo = useCallback(
        async (logoUrl: string) => {
            try {
                const success = await autoSave({ logo_url: logoUrl });
                if (success) {
                    setConfiguracoes((prev) =>
                        prev ? { ...prev, logo_url: logoUrl } : null
                    );
                    toast.success('Logo atualizado!');
                }
                return success;
            } catch (err) {
                console.error('🔴 Erro:', err);
                toast.error('Erro ao atualizar logo');
                return false;
            }
        },
        [autoSave]
    );

    // ============ ATUALIZAR ASSINATURA ============
    const atualizarAssinatura = useCallback(
        async (assinaturaUrl: string) => {
            try {
                const success = await autoSave({ assinatura_url: assinaturaUrl });
                if (success) {
                    setConfiguracoes((prev) =>
                        prev ? { ...prev, assinatura_url: assinaturaUrl } : null
                    );
                    toast.success('Assinatura atualizada!');
                }
                return success;
            } catch (err) {
                console.error('🔴 Erro:', err);
                toast.error('Erro ao atualizar assinatura');
                return false;
            }
        },
        [autoSave]
    );

    // ============ CLEANUP DO TIMER ============
    const cleanup = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
    }, []);

    return {
        configuracoes,
        loading,
        error,
        saveStatus,
        carregarConfiguracoes,
        atualizarCorPrimaria,
        atualizarMetodologia,
        atualizarConclusao,
        adicionarVistoriador,
        removerVistoriador,
        atualizarLogo,
        atualizarAssinatura,
        cleanup,
    };
}