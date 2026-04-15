import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  console.log('🔵 Login: user=', user?.email || 'null', 'loading=', loading);

  useEffect(() => {
    // Se usuário está autenticado e não estamos carregando, redirecionar IMEDIATAMENTE
    if (user && !loading && !hasRedirected.current) {
      console.log('🟢 Login: Usuário detectado, redirecionando para /dashboard');
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, loading, navigate]);

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-2"></div>
          <p className="text-white text-sm">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se usuário está autenticado, NÃO renderizar o formulário
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-2"></div>
          <p className="text-white text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Renderizar formulário de login APENAS se não há usuário autenticado
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-md">
        {/* Logo + Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Engenharia <span className="text-[#D4AF37]">AI</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Laudos técnicos com inteligência artificial
          </p>
        </div>

        {/* Auth UI */}
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#D4AF37',
                    brandAccent: '#B8962E',
                    inputBackground: '#1A1A1A',
                    inputBorder: '#3F3F46',
                    inputText: '#FFFFFF',
                    inputPlaceholder: '#71717A',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
            }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  link_text: 'Já tem uma conta? Entre',
                },
                sign_up: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Criar conta',
                  link_text: 'Não tem conta? Cadastre-se',
                },
                forgotten_password: {
                  link_text: 'Esqueceu a senha?',
                  button_label: 'Enviar instruções',
                },
              },
            }}
            view="sign_in"
          />
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Ao continuar, você concorda com nossos{' '}
          <span className="text-zinc-400 cursor-pointer hover:text-[#D4AF37]">
            Termos de Uso
          </span>{' '}
          e{' '}
          <span className="text-zinc-400 cursor-pointer hover:text-[#D4AF37]">
            Política de Privacidade
          </span>
        </p>
      </div>
    </div>
  );
}