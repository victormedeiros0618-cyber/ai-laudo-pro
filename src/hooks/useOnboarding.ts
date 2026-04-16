import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook que controla o estado do onboarding guiado (react-joyride).
 *
 * - Carrega `onboarding_completed` de `user_profiles` ao montar
 * - Expõe `shouldShowTour` para o componente decidir se inicia o tour
 * - `markAsCompleted()` persiste no banco (one-way — não reabre automaticamente)
 * - `resetOnboarding()` reseta a flag (útil para um botão "Ver tour novamente" em Configurações)
 */
export function useOnboarding() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState<boolean | null>(null);

    // Carregar estado ao montar / quando muda o usuário
    useEffect(() => {
        if (!user) {
            setLoading(false);
            setCompleted(null);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .maybeSingle();

                if (cancelled) return;

                if (error) {
                    console.error('[useOnboarding] Erro ao carregar status:', error);
                    // Fail open: não mostra tour em caso de erro (evita spam)
                    setCompleted(true);
                    return;
                }

                setCompleted(data?.onboarding_completed === true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const markAsCompleted = useCallback(async () => {
        if (!user) return false;

        // Atualiza otimisticamente
        setCompleted(true);

        const { error } = await supabase
            .from('user_profiles')
            .update({
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            console.error('[useOnboarding] Erro ao marcar onboarding como completo:', error);
            // Reverte otimista — tour vai reabrir na próxima sessão (melhor que perder o registro)
            setCompleted(false);
            return false;
        }
        return true;
    }, [user]);

    const resetOnboarding = useCallback(async () => {
        if (!user) return false;

        setCompleted(false);

        const { error } = await supabase
            .from('user_profiles')
            .update({
                onboarding_completed: false,
                onboarding_completed_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            console.error('[useOnboarding] Erro ao resetar onboarding:', error);
            setCompleted(true);
            return false;
        }
        return true;
    }, [user]);

    return {
        loading,
        // Só mostra tour quando: usuário carregado, não está loading, e onboarding NÃO foi completado
        shouldShowTour: !loading && completed === false,
        completed: completed === true,
        markAsCompleted,
        resetOnboarding,
    };
}
