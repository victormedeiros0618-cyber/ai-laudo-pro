import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/assets/logo';

/**
 * Login — VistorIA
 *
 * Visual: gradiente azul-preto (identidade técnica),
 * grid de blueprint sutil ao fundo, logo VistorIA centralizado,
 * card de autenticação com borda dourada.
 */

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (user && !loading && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAA520] mx-auto mb-2"></div>
          <p className="text-white text-sm">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAA520] mx-auto mb-2"></div>
          <p className="text-white text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-gradient-tech bg-tech-grid overflow-hidden">
      {/* Glow neon decorativo */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15"
        style={{ background: 'radial-gradient(circle, #DAA520 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo + Tagline */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo
              className="h-12 w-auto"
              textColor="#FFFFFF"
              accentColor="#F4C430"
            />
          </div>
          <p className="text-sm text-zinc-300 font-medium tracking-wide">
            Laudos de Engenharia. Precisão com IA.
          </p>
        </div>

        {/* Card de Autenticação */}
        <div className="bg-[#0F1525]/80 backdrop-blur-md border border-[#2A3558] rounded-xl p-6 shadow-xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3B5BDB',
                    brandAccent: '#00D4FF',
                    inputBackground: '#151B2E',
                    inputBorder: '#2A3558',
                    inputText: '#FFFFFF',
                    inputPlaceholder: '#6B7280',
                    messageText: '#D1D5DB',
                    anchorTextColor: '#00D4FF',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    inputBorderRadius: '8px',
                  },
                  fonts: {
                    bodyFontFamily: 'Inter, system-ui, sans-serif',
                    buttonFontFamily: 'Inter, system-ui, sans-serif',
                    inputFontFamily: 'Inter, system-ui, sans-serif',
                    labelFontFamily: 'Inter, system-ui, sans-serif',
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

        <p className="text-center text-xs text-zinc-400 mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-zinc-300 hover:text-[#00D4FF] transition-colors">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="#" className="text-zinc-300 hover:text-[#00D4FF] transition-colors">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
