import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type PlanId = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface Subscription {
    id: string;
    user_id: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    plan_id: PlanId;
    status: SubscriptionStatus;
    laudos_used: number;
    laudos_limit: number;
    current_period_end?: string;
    cancel_at_period_end: boolean;
    updated_at: string;
}

export interface PlanInfo {
    id: PlanId;
    nome: string;
    preco: number;
    laudos_limit: number;
    features: string[];
}

const PLANOS: Record<PlanId, PlanInfo> = {
    free: {
        id: 'free',
        nome: 'Gratuito',
        preco: 0,
        laudos_limit: 2,
        features: [
            '2 laudos por mês',
            'Análise IA básica',
            'PDF simples',
            'Suporte por email',
        ],
    },
    pro: {
        id: 'pro',
        nome: 'Profissional',
        preco: 99,
        laudos_limit: 50,
        features: [
            '50 laudos por mês',
            'Análise IA avançada',
            'PDF customizado',
            'Assinatura digital',
            'Suporte prioritário',
            'API access',
        ],
    },
    enterprise: {
        id: 'enterprise',
        nome: 'Enterprise',
        preco: 0, // Contato
        laudos_limit: 999,
        features: [
            'Laudos ilimitados',
            'Análise IA premium',
            'White-label',
            'Integração customizada',
            'Suporte 24/7',
            'SLA garantido',
        ],
    },
};

export function useSubscriptions() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    // ============ CARREGAR SUBSCRIPTION ============
    const carregarSubscription = useCallback(async () => {
        if (!user) {
            setError('Usuário não autenticado');
            return null;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (err && err.code !== 'PGRST116') {
                console.error('[useSubscriptions] Erro ao carregar subscription:', err);
                setError(err.message);
                return null;
            }

            if (data) {
                
                setSubscription(data as Subscription);
                return data as Subscription;
            }

            // Se não existe, criar padrão (free)
            
            const novaSubscription = await criarSubscriptionPadrao();
            return novaSubscription;
        } catch (err) {
            console.error('[useSubscriptions] Erro:', err);
            setError('Erro ao carregar subscription');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // ============ CRIAR SUBSCRIPTION PADRÃO ============
    const criarSubscriptionPadrao = useCallback(async () => {
        if (!user) return null;

        try {
            const { data, error: err } = await supabase
                .from('subscriptions')
                .insert([
                    {
                        user_id: user.id,
                        plan_id: 'free',
                        status: 'active',
                        laudos_used: 0,
                        laudos_limit: 2,
                        cancel_at_period_end: false,
                    },
                ])
                .select()
                .single();

            if (err) {
                console.error('[useSubscriptions] Erro ao criar subscription:', err);
                return null;
            }

            
            setSubscription(data as Subscription);
            return data as Subscription;
        } catch (err) {
            console.error('[useSubscriptions] Erro:', err);
            return null;
        }
    }, [user]);

    // ============ VERIFICAR LIMITE DE LAUDOS ============
    const podecriarLaudo = useCallback((): boolean => {
        if (!subscription) return false;
        return subscription.laudos_used < subscription.laudos_limit;
    }, [subscription]);

    // ============ OBTER PLANO ATUAL ============
    const obterPlanoAtual = useCallback((): PlanInfo | null => {
        if (!subscription) return null;
        return PLANOS[subscription.plan_id] || null;
    }, [subscription]);

    // ============ OBTER PROGRESSO DE LAUDOS ============
    const obterProgressoLaudos = useCallback((): {
        usado: number;
        limite: number;
        percentual: number;
        restante: number;
    } | null => {
        if (!subscription) return null;

        const usado = subscription.laudos_used;
        const limite = subscription.laudos_limit;
        const percentual = (usado / limite) * 100;
        const restante = limite - usado;

        return { usado, limite, percentual, restante };
    }, [subscription]);

    // ============ ATUALIZAR PLANO ============
    // Nota: incrementarLaudosUsados foi removido do frontend.
    // O incremento de laudos_used é feito de forma atômica pela Edge Function
    // gemini-analyze (via RPC increment_laudos_used) após análise bem-sucedida.
    const atualizarPlano = useCallback(
        async (novoPlanId: PlanId, stripeSubscriptionId?: string) => {
            if (!user || !subscription) {
                setError('Subscription não carregada');
                return false;
            }

            try {
                setLoading(true);
                setError(null);

                const novoPlano = PLANOS[novoPlanId];
                if (!novoPlano) {
                    setError('Plano inválido');
                    return false;
                }

                const { error: err } = await supabase
                    .from('subscriptions')
                    .update({
                        plan_id: novoPlanId,
                        laudos_limit: novoPlano.laudos_limit,
                        stripe_subscription_id: stripeSubscriptionId || null,
                        status: 'active',
                        cancel_at_period_end: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (err) {
                    console.error('[useSubscriptions] Erro ao atualizar plano:', err);
                    setError(err.message);
                    toast.error('Erro ao atualizar plano');
                    return false;
                }

                // Atualizar estado local
                setSubscription((prev) =>
                    prev
                        ? {
                            ...prev,
                            plan_id: novoPlanId,
                            laudos_limit: novoPlano.laudos_limit,
                            status: 'active',
                            cancel_at_period_end: false,
                        }
                        : null
                );

                
                toast.success(`Plano atualizado para ${novoPlano.nome}!`);
                return true;
            } catch (err) {
                console.error('[useSubscriptions] Erro:', err);
                setError('Erro ao atualizar plano');
                toast.error('Erro ao atualizar plano');
                return false;
            } finally {
                setLoading(false);
            }
        },
        [user, subscription]
    );

    // ============ CANCELAR SUBSCRIPTION ============
    const cancelarSubscription = useCallback(async () => {
        if (!user || !subscription) {
            setError('Subscription não carregada');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const { error: err } = await supabase
                .from('subscriptions')
                .update({
                    status: 'canceled',
                    cancel_at_period_end: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (err) {
                console.error('[useSubscriptions] Erro ao cancelar subscription:', err);
                setError(err.message);
                toast.error('Erro ao cancelar subscription');
                return false;
            }

            // Atualizar estado local
            setSubscription((prev) =>
                prev
                    ? {
                        ...prev,
                        status: 'canceled',
                        cancel_at_period_end: true,
                    }
                    : null
            );

            
            toast.success('Subscription cancelada');
            return true;
        } catch (err) {
            console.error('[useSubscriptions] Erro:', err);
            setError('Erro ao cancelar subscription');
            toast.error('Erro ao cancelar subscription');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, subscription]);

    // ============ REATIVAR SUBSCRIPTION ============
    const reativarSubscription = useCallback(async () => {
        if (!user || !subscription) {
            setError('Subscription não carregada');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const { error: err } = await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    cancel_at_period_end: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (err) {
                console.error('[useSubscriptions] Erro ao reativar subscription:', err);
                setError(err.message);
                toast.error('Erro ao reativar subscription');
                return false;
            }

            // Atualizar estado local
            setSubscription((prev) =>
                prev
                    ? {
                        ...prev,
                        status: 'active',
                        cancel_at_period_end: false,
                    }
                    : null
            );

            
            toast.success('Subscription reativada!');
            return true;
        } catch (err) {
            console.error('[useSubscriptions] Erro:', err);
            setError('Erro ao reativar subscription');
            toast.error('Erro ao reativar subscription');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, subscription]);

    return {
        subscription,
        loading,
        error,
        carregarSubscription,
        podecriarLaudo,
        obterPlanoAtual,
        obterProgressoLaudos,
        atualizarPlano,
        cancelarSubscription,
        reativarSubscription,
        PLANOS,
    };
}