import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserProfile {
    id: string;
    full_name?: string;
    lgpd_consent_at?: string;
    terms_version: string;
    deletion_requested_at?: string;
    created_at: string;
    updated_at: string;
}

interface UpdateProfileInput {
    full_name?: string;
    lgpd_consent_at?: string;
    terms_version?: string;
}

export function useUserProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // ============ CARREGAR PERFIL ============
    const carregarPerfil = useCallback(async () => {
        if (!user) {
            setError('Usuário não autenticado');
            return null;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: err } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (err && err.code !== 'PGRST116') {
                console.error('🔴 Erro ao carregar perfil:', err);
                setError(err.message);
                return null;
            }

            if (data) {
                console.log('🟢 Perfil carregado');
                setProfile(data as UserProfile);
                return data as UserProfile;
            }

            // Se não existe, criar padrão
            console.log('🟡 Perfil não encontrado, criando padrão...');
            const novoPerfil = await criarPerfilPadrao();
            return novoPerfil;
        } catch (err) {
            console.error('🔴 Erro:', err);
            setError('Erro ao carregar perfil');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // ============ CRIAR PERFIL PADRÃO ============
    const criarPerfilPadrao = useCallback(async () => {
        if (!user) return null;

        try {
            const { data, error: err } = await supabase
                .from('user_profiles')
                .insert([
                    {
                        id: user.id,
                        full_name: user.email?.split('@')[0] || 'Usuário',
                        terms_version: 'v1.0',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (err) {
                console.error('🔴 Erro ao criar perfil:', err);
                return null;
            }

            console.log('🟢 Perfil padrão criado');
            setProfile(data as UserProfile);
            return data as UserProfile;
        } catch (err) {
            console.error('🔴 Erro:', err);
            return null;
        }
    }, [user]);

    // ============ ATUALIZAR NOME ============
    const atualizarNome = useCallback(
        async (fullName: string) => {
            if (!user || !profile) {
                setError('Perfil não carregado');
                toast.error('Carregue o perfil primeiro');
                return false;
            }

            if (!fullName.trim()) {
                setError('Nome não pode estar vazio');
                toast.error('Digite um nome válido');
                return false;
            }

            try {
                setLoading(true);
                setError(null);

                const { error: err } = await supabase
                    .from('user_profiles')
                    .update({
                        full_name: fullName.trim(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id);

                if (err) {
                    console.error('🔴 Erro ao atualizar nome:', err);
                    setError(err.message);
                    toast.error('Erro ao atualizar nome');
                    return false;
                }

                // Atualizar estado local
                setProfile((prev) =>
                    prev ? { ...prev, full_name: fullName.trim() } : null
                );

                console.log('🟢 Nome atualizado');
                toast.success('Nome atualizado com sucesso!');
                return true;
            } catch (err) {
                console.error('🔴 Erro:', err);
                setError('Erro ao atualizar nome');
                toast.error('Erro ao atualizar nome');
                return false;
            } finally {
                setLoading(false);
            }
        },
        [user, profile]
    );

    // ============ ACEITAR TERMOS E LGPD ============
    const aceitarTermosLGPD = useCallback(async () => {
        if (!user || !profile) {
            setError('Perfil não carregado');
            toast.error('Carregue o perfil primeiro');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const agora = new Date().toISOString();

            const { error: err } = await supabase
                .from('user_profiles')
                .update({
                    lgpd_consent_at: agora,
                    terms_version: 'v1.0',
                    updated_at: agora,
                })
                .eq('id', user.id);

            if (err) {
                console.error('🔴 Erro ao aceitar termos:', err);
                setError(err.message);
                toast.error('Erro ao aceitar termos');
                return false;
            }

            // Atualizar estado local
            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        lgpd_consent_at: agora,
                        terms_version: 'v1.0',
                    }
                    : null
            );

            console.log('🟢 Termos e LGPD aceitos');
            toast.success('Termos aceitos com sucesso!');
            return true;
        } catch (err) {
            console.error('🔴 Erro:', err);
            setError('Erro ao aceitar termos');
            toast.error('Erro ao aceitar termos');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    // ============ VERIFICAR CONSENTIMENTO LGPD ============
    const temConsentimentoLGPD = useCallback((): boolean => {
        return !!profile?.lgpd_consent_at;
    }, [profile]);

    // ============ SOLICITAR EXCLUSÃO DE CONTA ============
    const solicitarExclusaoConta = useCallback(async () => {
        if (!user || !profile) {
            setError('Perfil não carregado');
            toast.error('Carregue o perfil primeiro');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const agora = new Date().toISOString();

            const { error: err } = await supabase
                .from('user_profiles')
                .update({
                    deletion_requested_at: agora,
                    updated_at: agora,
                })
                .eq('id', user.id);

            if (err) {
                console.error('🔴 Erro ao solicitar exclusão:', err);
                setError(err.message);
                toast.error('Erro ao solicitar exclusão');
                return false;
            }

            // Atualizar estado local
            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        deletion_requested_at: agora,
                    }
                    : null
            );

            console.log('🟢 Exclusão de conta solicitada');
            toast.success(
                'Solicitação de exclusão enviada. Sua conta será deletada em 30 dias.'
            );
            return true;
        } catch (err) {
            console.error('🔴 Erro:', err);
            setError('Erro ao solicitar exclusão');
            toast.error('Erro ao solicitar exclusão');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    // ============ CANCELAR EXCLUSÃO DE CONTA ============
    const cancelarExclusaoConta = useCallback(async () => {
        if (!user || !profile) {
            setError('Perfil não carregado');
            toast.error('Carregue o perfil primeiro');
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            const { error: err } = await supabase
                .from('user_profiles')
                .update({
                    deletion_requested_at: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (err) {
                console.error('🔴 Erro ao cancelar exclusão:', err);
                setError(err.message);
                toast.error('Erro ao cancelar exclusão');
                return false;
            }

            // Atualizar estado local
            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        deletion_requested_at: undefined,
                    }
                    : null
            );

            console.log('🟢 Exclusão de conta cancelada');
            toast.success('Exclusão de conta cancelada!');
            return true;
        } catch (err) {
            console.error('🔴 Erro:', err);
            setError('Erro ao cancelar exclusão');
            toast.error('Erro ao cancelar exclusão');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    // ============ VERIFICAR SE EXCLUSÃO FOI SOLICITADA ============
    const temExclusaoSolicitada = useCallback((): boolean => {
        return !!profile?.deletion_requested_at;
    }, [profile]);

    // ============ OBTER DIAS RESTANTES PARA EXCLUSÃO ============
    const obterDiasRestantesExclusao = useCallback((): number | null => {
        if (!profile?.deletion_requested_at) return null;

        const dataExclusao = new Date(profile.deletion_requested_at);
        dataExclusao.setDate(dataExclusao.getDate() + 30);

        const agora = new Date();
        const diasRestantes = Math.ceil(
            (dataExclusao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
        );

        return Math.max(0, diasRestantes);
    }, [profile]);

    return {
        profile,
        loading,
        error,
        carregarPerfil,
        atualizarNome,
        aceitarTermosLGPD,
        temConsentimentoLGPD,
        solicitarExclusaoConta,
        cancelarExclusaoConta,
        temExclusaoSolicitada,
        obterDiasRestantesExclusao,
    };
}