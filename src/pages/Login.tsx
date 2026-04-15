import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/assets/logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/**
 * Login — VistorIA
 *
 * Adaptável a claro e escuro:
 *   - Dark: gradiente azul-preto + glow neon + logo branco
 *   - Light: fundo claro com grid técnico + logo azul + card com borda
 *
 * Rotas:
 *   - /login    → view=sign_in
 *   - /cadastro → view=sign_up
 */

interface LoginProps {
  defaultView?: 'sign_in' | 'sign_up';
}

export default function Login({ defaultView }: LoginProps = {}) {
  const location = useLocation();
  const view = defaultView ?? (location.pathname === '/cadastro' ? 'sign_up' : 'sign_in');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (user && !loading && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2" />
          <p className="text-text-secondary text-sm">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2" />
          <p className="text-text-secondary text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-bg bg-tech-grid overflow-hidden transition-colors">
      {/* Toggle de tema fixo no topo */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="outline" />
      </div>

      {/* Gradientes decorativos — mais sutis no light, intensos no dark */}
      <div
        className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'opacity-20' : 'opacity-30'}`}
        style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }}
      />
      <div
        className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'opacity-15' : 'opacity-25'}`}
        style={{ background: 'radial-gradient(circle, #DAA520 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo + Tagline */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo
              className="h-12 w-auto"
              textColor={isDark ? '#FFFFFF' : '#1E3A8A'}
              accentColor={isDark ? '#F4C430' : '#DAA520'}
            />
          </div>
          <p className={`text-sm font-medium tracking-wide ${isDark ? 'text-zinc-300' : 'text-text-secondary'}`}>
            {view === 'sign_up'
              ? 'Crie sua conta e gere seu primeiro laudo em minutos.'
              : 'Laudos de Engenharia. Precisão com IA.'}
          </p>
        </div>

        {/* Card de Autenticação */}
        <div
          className={`rounded-xl p-6 shadow-xl backdrop-blur-md transition-colors ${
            isDark
              ? 'bg-[#0F1525]/80 border border-[#2A3558]'
              : 'bg-white border border-border'
          }`}
        >
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: isDark
                    ? {
                        brand: '#3B5BDB',
                        brandAccent: '#00D4FF',
                        inputBackground: '#151B2E',
                        inputBorder: '#2A3558',
                        inputText: '#FFFFFF',
                        inputPlaceholder: '#6B7280',
                        messageText: '#D1D5DB',
                        anchorTextColor: '#00D4FF',
                      }
                    : {
                        brand: '#1E3A8A',
                        brandAccent: '#1E40AF',
                        inputBackground: '#FFFFFF',
                        inputBorder: '#D1D5DB',
                        inputText: '#374151',
                        inputPlaceholder: '#9CA3AF',
                        messageText: '#4B5563',
                        anchorTextColor: '#1E3A8A',
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
            view={view}
          />
        </div>

        <p className={`text-center text-xs mt-6 ${isDark ? 'text-zinc-400' : 'text-text-muted'}`}>
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="underline hover:text-primary dark:hover:text-[#00D4FF] transition-colors">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="#" className="underline hover:text-primary dark:hover:text-[#00D4FF] transition-colors">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
