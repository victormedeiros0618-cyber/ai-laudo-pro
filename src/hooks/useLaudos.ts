import { useCallback, useState } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { RelatorioIA, TipoVistoria, Laudo } from '@/types';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CreateLaudoInput {
    cliente: string;
    tipo_vistoria: TipoVistoria;
    data_vistoria: string;
    endereco?: string;
    responsavel?: string;
    titulo?: string;
    conteudo_json: RelatorioIA;
}

interface UpdateLaudoInput {
    titulo?: string;
    endereco?: string;
    responsavel?: string;
    conteudo_json?: RelatorioIA;
    status?: 'draft' | 'finalizado' | 'assinado';
    pdf_url?: string;
}

export interface FiltrosLaudo {
    status?: 'draft' | 'finalizado' | 'assinado';
    tipo_vistoria?: TipoVistoria;
    busca?: string;          // ilike em cliente + endereco
}

const PAGE_SIZE = 20;
const LAUDOS_KEY = ['laudos'];

// ── Hook principal (CRUD) ─────────────────────────────────────────────────────

export function useLaudos() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const obterLaudo = useCallback(async (laudoId: string) => {
        if (!user) return null;

        const { data, error } = await supabase
            .from('laudos')
            .select('*')
            .eq('id', laudoId)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Erro ao obter laudo:', error);
            return null;
        }

        return data as Laudo;
    }, [user]);

    const criarLaudo = useCallback(async (input: CreateLaudoInput) => {
        if (!user) {
            toast.error('Você precisa estar autenticado');
            return null;
        }

        const { data, error } = await supabase
            .from('laudos')
            .insert([{
                user_id: user.id,
                cliente: input.cliente,
                tipo_vistoria: input.tipo_vistoria,
                data_vistoria: input.data_vistoria,
                endereco: input.endereco || null,
                responsavel: input.responsavel || null,
                titulo: input.titulo || null,
                conteudo_json: input.conteudo_json,
                status: 'draft',
            }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar laudo:', error);
            toast.error('Erro ao criar laudo');
            return null;
        }

        toast.success('Laudo criado com sucesso!');
        queryClient.invalidateQueries({ queryKey: LAUDOS_KEY });
        return data as Laudo;
    }, [user, queryClient]);

    const atualizarLaudo = useCallback(async (laudoId: string, input: UpdateLaudoInput) => {
        if (!user) {
            toast.error('Você precisa estar autenticado');
            return null;
        }

        const { data, error } = await supabase
            .from('laudos')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', laudoId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar laudo:', error);
            toast.error('Erro ao atualizar laudo');
            return null;
        }

        toast.success('Laudo atualizado com sucesso!');
        queryClient.invalidateQueries({ queryKey: LAUDOS_KEY });
        return data as Laudo;
    }, [user, queryClient]);

    const deletarLaudo = useCallback(async (laudoId: string) => {
        if (!user) {
            toast.error('Você precisa estar autenticado');
            return false;
        }

        // Remove PDF orphan do Storage antes de deletar o registro
        const { data: laudo } = await supabase
            .from('laudos')
            .select('pdf_url')
            .eq('id', laudoId)
            .eq('user_id', user.id)
            .single();

        if (laudo?.pdf_url) {
            // pdf_url é algo como: https://<project>.supabase.co/storage/v1/object/public/laudos-pdf/<path>
            // Extrai apenas o path após "laudos-pdf/"
            const match = laudo.pdf_url.match(/laudos-pdf\/(.+)$/);
            if (match?.[1]) {
                const { error: storageError } = await supabase.storage
                    .from('laudos-pdf')
                    .remove([match[1]]);
                if (storageError) {
                    console.error('Aviso: falha ao remover PDF do Storage:', storageError.message);
                    // Não bloqueia: continua para deletar o registro
                }
            }
        }

        const { error } = await supabase
            .from('laudos')
            .delete()
            .eq('id', laudoId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Erro ao deletar laudo:', error);
            toast.error('Erro ao deletar laudo');
            return false;
        }

        toast.success('Laudo excluído com sucesso!');
        queryClient.invalidateQueries({ queryKey: LAUDOS_KEY });
        return true;
    }, [user, queryClient]);

    const gerarPDF = useCallback(async (laudoId: string, pdfUrl: string) => {
        if (!user) return false;

        const { error } = await supabase
            .from('laudos')
            .update({
                pdf_url: pdfUrl,
                status: 'finalizado',
                updated_at: new Date().toISOString(),
            })
            .eq('id', laudoId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Erro ao salvar PDF:', error);
            toast.error('Erro ao salvar PDF');
            return false;
        }

        queryClient.invalidateQueries({ queryKey: LAUDOS_KEY });
        return true;
    }, [user, queryClient]);

    return {
        obterLaudo,
        criarLaudo,
        atualizarLaudo,
        deletarLaudo,
        gerarPDF,
    };
}

// ── Hook de listagem simples (sem paginação — para uso interno/testes) ────────

export function useLaudosQuery() {
    const { user } = useAuth();

    return useQuery({
        queryKey: [...LAUDOS_KEY, 'all'],
        queryFn: async (): Promise<Laudo[]> => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('laudos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(PAGE_SIZE);

            if (error) {
                toast.error('Erro ao carregar laudos');
                throw error;
            }
            return (data as Laudo[]) || [];
        },
        enabled: !!user,
    });
}

// ── Hook de listagem paginada com filtros (para Historico.tsx) ────────────────

export function useLaudosPaginados(filtros: FiltrosLaudo) {
    const { user } = useAuth();

    return useInfiniteQuery({
        queryKey: [...LAUDOS_KEY, 'paginados', filtros],
        initialPageParam: 0,
        queryFn: async ({ pageParam }): Promise<{ items: Laudo[]; nextOffset: number | null }> => {
            if (!user) return { items: [], nextOffset: null };

            const offset = pageParam as number;

            let query = supabase
                .from('laudos')
                .select('id, user_id, created_at, titulo, cliente, endereco, gravidade, tipo_vistoria, responsavel, data_vistoria, pdf_url, status', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            // Filtros server-side
            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }
            if (filtros.tipo_vistoria) {
                query = query.eq('tipo_vistoria', filtros.tipo_vistoria);
            }
            if (filtros.busca && filtros.busca.trim()) {
                // Busca em cliente e endereço via or
                query = query.or(
                    `cliente.ilike.%${filtros.busca.trim()}%,endereco.ilike.%${filtros.busca.trim()}%`
                );
            }

            const { data, error, count } = await query;

            if (error) {
                toast.error('Erro ao carregar laudos');
                throw error;
            }

            const items = (data as Laudo[]) || [];
            const totalCarregado = offset + items.length;
            const nextOffset = count !== null && totalCarregado < count ? totalCarregado : null;

            return { items, nextOffset };
        },
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });
}

// ── Mutation: deletar via React Query (para uso no Historico.tsx) ─────────────

export function useDeletarLaudo() {
    const queryClient = useQueryClient();
    const { deletarLaudo } = useLaudos();

    return useMutation({
        mutationFn: (laudoId: string) => deletarLaudo(laudoId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LAUDOS_KEY });
        },
    });
}

// ── Hook de tipos únicos (para o select de filtro) ────────────────────────────

export function useTiposVistoria() {
    const { user } = useAuth();

    return useQuery({
        queryKey: [...LAUDOS_KEY, 'tipos'],
        queryFn: async (): Promise<TipoVistoria[]> => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('laudos')
                .select('tipo_vistoria')
                .eq('user_id', user.id);

            if (error) throw error;
            const unique = [...new Set((data ?? []).map((r) => r.tipo_vistoria as TipoVistoria))];
            return unique;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 10,
    });
}
