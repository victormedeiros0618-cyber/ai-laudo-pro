/**
 * useAuth.tsx — CORRIGIDO
 *
 * MUDANÇAS:
 * 1. user tipado como AppUser | null (em vez de `any`)
 * 2. signOut simplificado: removida limpeza manual do localStorage
 *    (o SDK do Supabase já gerencia isso; a versão anterior tinha timing frágil)
 * 3. console.log de debug removidos (apenas erros reais ficam)
 * 4. Listener de auth state change simplificado: a guarda com isSigningOutRef
 *    era necessária por causa da limpeza manual — sem ela, não precisa mais
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/types';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const subscriptionRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange> | null>(null);

    useEffect(() => {
        // Carrega sessão existente
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser((session?.user as AppUser) ?? null);
            setLoading(false);
        });

        // Listener de mudanças de auth
        if (!subscriptionRef.current) {
            subscriptionRef.current = supabase.auth.onAuthStateChange((_event, session) => {
                setUser((session?.user as AppUser) ?? null);
                setLoading(false);
            });
        }

        return () => {
            subscriptionRef.current?.data.subscription.unsubscribe();
            subscriptionRef.current = null;
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setLoading(false);
            throw error;
        }
        // setLoading(false) é chamado pelo onAuthStateChange
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        if (error) {
            setLoading(false);
            throw error;
        }
    };

    const signOut = async () => {
        setLoading(true);
        // FIX: o SDK do Supabase limpa o localStorage automaticamente.
        // Não precisa nem deve ser feito manualmente — causava race conditions.
        const { error } = await supabase.auth.signOut();
        if (error) {
            setLoading(false);
            throw error;
        }
        // onAuthStateChange vai setar user = null automaticamente
        navigate('/login', { replace: true });
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
}
