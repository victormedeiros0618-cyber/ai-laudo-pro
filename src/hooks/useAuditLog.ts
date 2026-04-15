import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AuditAction =
    | 'CREATE_LAUDO'
    | 'UPDATE_LAUDO'
    | 'DELETE_LAUDO'
    | 'FINALIZE_LAUDO'
    | 'SIGN_LAUDO'
    | 'GENERATE_PDF'
    | 'UPDATE_CONFIG'
    | 'UPDATE_PROFILE'
    | 'UPGRADE_PLAN'
    | 'CANCEL_PLAN'
    | 'LOGIN'
    | 'LOGOUT'
    | 'DELETE_ACCOUNT_REQUEST';

export interface AuditLog {
    id: string;
    user_id: string;
    action: AuditAction;
    resource_id?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

interface LogActionInput {
    action: AuditAction;
    resource_id?: string;
    metadata?: Record<string, unknown>;
}

export function useAuditLog() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ============ REGISTRAR AÇÃO ============
    const registrarAcao = useCallback(
        async (input: LogActionInput) => {
            if (!user) {
                console.warn('🟡 Audit log: Usuário não autenticado');
                return false;
            }

            try {
                setLoading(true);
                setError(null);

                const { error: err } = await supabase
                    .from('audit_log')
                    .insert([
                        {
                            user_id: user.id,
                            action: input.action,
                            resource_id: input.resource_id || null,
                            metadata: input.metadata || null,
                            created_at: new Date().toISOString(),
                        },
                    ]);

                if (err) {
                    console.error('🔴 Erro ao registrar ação:', err);
                    setError(err.message);
                    return false;
                }

                console.log('🟢 Ação registrada:', input.action);
                return true;
            } catch (err) {
                console.error('🔴 Erro:', err);
                setError('Erro ao registrar ação');
                return false;
            } finally {
                setLoading(false);
            }
        },
        [user]
    );

    // ============ LISTAR AUDIT LOGS ============
    const listarLogs = useCallback(
        async (limite: number = 50) => {
            if (!user) {
                setError('Usuário não autenticado');
                return [];
            }

            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('audit_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(limite);

                if (err) {
                    console.error('🔴 Erro ao listar logs:', err);
                    setError(err.message);
                    return [];
                }

                console.log('🟢 Logs carregados:', data?.length);
                return (data as AuditLog[]) || [];
            } catch (err) {
                console.error('🔴 Erro:', err);
                setError('Erro ao listar logs');
                return [];
            } finally {
                setLoading(false);
            }
        },
        [user]
    );

    // ============ LISTAR LOGS POR AÇÃO ============
    const listarLogsPorAcao = useCallback(
        async (action: AuditAction, limite: number = 50) => {
            if (!user) {
                setError('Usuário não autenticado');
                return [];
            }

            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('audit_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('action', action)
                    .order('created_at', { ascending: false })
                    .limit(limite);

                if (err) {
                    console.error('🔴 Erro ao listar logs:', err);
                    setError(err.message);
                    return [];
                }

                console.log('🟢 Logs filtrados:', data?.length);
                return (data as AuditLog[]) || [];
            } catch (err) {
                console.error('🔴 Erro:', err);
                setError('Erro ao listar logs');
                return [];
            } finally {
                setLoading(false);
            }
        },
        [user]
    );

    // ============ LISTAR LOGS POR RECURSO ============
    const listarLogsPorRecurso = useCallback(
        async (resourceId: string, limite: number = 50) => {
            if (!user) {
                setError('Usuário não autenticado');
                return [];
            }

            try {
                setLoading(true);
                setError(null);

                const { data, error: err } = await supabase
                    .from('audit_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('resource_id', resourceId)
                    .order('created_at', { ascending: false })
                    .limit(limite);

                if (err) {
                    console.error('🔴 Erro ao listar logs:', err);
                    setError(err.message);
                    return [];
                }

                console.log('🟢 Logs do recurso carregados:', data?.length);
                return (data as AuditLog[]) || [];
            } catch (err) {
                console.error('🔴 Erro:', err);
                setError('Erro ao listar logs');
                return [];
            } finally {
                setLoading(false);
            }
        },
        [user]
    );

    // ============ OBTER ESTATÍSTICAS DE AÇÕES ============
    const obterEstatisticas = useCallback(
        async (dias: number = 30) => {
            if (!user) {
                setError('Usuário não autenticado');
                return null;
            }

            try {
                setLoading(true);
                setError(null);

                const dataLimite = new Date();
                dataLimite.setDate(dataLimite.getDate() - dias);

                const { data, error: err } = await supabase
                    .from('audit_log')
                    .select('action')
                    .eq('user_id', user.id)
                    .gte('created_at', dataLimite.toISOString());

                if (err) {
                    console.error('🔴 Erro ao obter estatísticas:', err);
                    setError(err.message);
                    return null;
                }

                // Contar ações
                const contadores: Record<AuditAction, number> = {} as Record<
                    AuditAction,
                    number
                >;

                (data as AuditLog[]).forEach((log) => {
                    contadores[log.action] = (contadores[log.action] || 0) + 1;
                });

                console.log('🟢 Estatísticas calculadas');
                return {
                    totalAcoes: data?.length || 0,
                    contadores,
                    periodo: `${dias} dias`,
                };
            } catch (err) {
                console.error('🔴 Erro:', err);
                setError('Erro ao obter estatísticas');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [user]
    );

    // ============ HELPERS PARA AÇÕES COMUNS ============

    const registrarCriacaoLaudo = useCallback(
        (laudoId: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'CREATE_LAUDO',
                resource_id: laudoId,
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarAtualizacaoLaudo = useCallback(
        (laudoId: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'UPDATE_LAUDO',
                resource_id: laudoId,
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarDelecaoLaudo = useCallback(
        (laudoId: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'DELETE_LAUDO',
                resource_id: laudoId,
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarFinalizacaoLaudo = useCallback(
        (laudoId: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'FINALIZE_LAUDO',
                resource_id: laudoId,
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarAssinaturaPDF = useCallback(
        (laudoId: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'SIGN_LAUDO',
                resource_id: laudoId,
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarGeracaoPDF = useCallback(
        (laudoId: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'GENERATE_PDF',
                resource_id: laudoId,
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarAtualizacaoConfig = useCallback(
        (metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'UPDATE_CONFIG',
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarAtualizacaoPerfil = useCallback(
        (metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'UPDATE_PROFILE',
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarUpgradePlano = useCallback(
        (novoPlan: string, metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'UPGRADE_PLAN',
                metadata: { ...metadata, novo_plano: novoPlan },
            });
        },
        [registrarAcao]
    );

    const registrarCancelamentoPlano = useCallback(
        (metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'CANCEL_PLAN',
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarLogin = useCallback(
        (metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'LOGIN',
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarLogout = useCallback(
        (metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'LOGOUT',
                metadata,
            });
        },
        [registrarAcao]
    );

    const registrarSolicitacaoExclusao = useCallback(
        (metadata?: Record<string, unknown>) => {
            return registrarAcao({
                action: 'DELETE_ACCOUNT_REQUEST',
                metadata,
            });
        },
        [registrarAcao]
    );

    return {
        loading,
        error,
        registrarAcao,
        listarLogs,
        listarLogsPorAcao,
        listarLogsPorRecurso,
        obterEstatisticas,
        // Helpers
        registrarCriacaoLaudo,
        registrarAtualizacaoLaudo,
        registrarDelecaoLaudo,
        registrarFinalizacaoLaudo,
        registrarAssinaturaPDF,
        registrarGeracaoPDF,
        registrarAtualizacaoConfig,
        registrarAtualizacaoPerfil,
        registrarUpgradePlano,
        registrarCancelamentoPlano,
        registrarLogin,
        registrarLogout,
        registrarSolicitacaoExclusao,
    };
}