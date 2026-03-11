import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login — will be replaced with Supabase auth
    setTimeout(() => {
      setLoading(false);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }, 800);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast.error('As senhas não conferem');
      return;
    }
    if (signupPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (!acceptTerms) {
      toast.error('Aceite os termos para continuar');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Verifique seu e-mail para confirmar o cadastro');
      setShowSignup(false);
    }, 800);
  };

  const handleForgotPassword = () => {
    if (!email) {
      toast.error('Digite seu e-mail primeiro');
      return;
    }
    toast.success('E-mail de recuperação enviado!');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left column — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'var(--color-primary)' }}
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Engenharia AI</h1>
          <p className="font-display text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
            Laudos Técnicos Inteligentes
          </p>
        </div>

        <div className="space-y-6">
          {[
            'Laudos técnicos em minutos, não dias',
            'Padrão ABNT/NBR com rastreabilidade jurídica',
            'White-label total para seu escritório',
          ].map((text) => (
            <div key={text} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                style={{ background: 'var(--color-accent)' }}
              >
                <Check size={12} color="#fff" />
              </div>
              <p className="text-white/90 text-sm font-body">{text}</p>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-xs font-body">v1.0.0 · © {new Date().getFullYear()} Engenharia AI</p>
      </div>

      {/* Right column */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              Engenharia AI
            </h1>
          </div>

          <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Bem-vindo de volta
          </h2>
          <p className="text-sm mb-8 font-body" style={{ color: 'var(--color-text-muted)' }}>
            Faça login para acessar seus laudos
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body pr-10"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-body hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Esqueci minha senha
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: loading ? 'var(--color-primary-hover)' : 'var(--color-primary)' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-primary-hover)'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-primary)'; }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => setShowSignup(true)}
              className="w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
                background: 'var(--color-surface)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
            >
              Criar conta
            </button>
          </form>
        </div>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-md rounded-[var(--radius-lg)] p-6 relative"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-xl)' }}
          >
            <button
              onClick={() => setShowSignup(false)}
              className="absolute top-4 right-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Criar conta
            </h3>
            <p className="text-xs mb-6 font-body" style={{ color: 'var(--color-text-muted)' }}>
              Comece gratuitamente com 2 laudos
            </p>

            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              />
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              />
              <div className="relative">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Senha (mínimo 8 caracteres)"
                  required
                  className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body pr-10"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="Confirmar senha"
                required
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              />
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span className="text-xs font-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Li e aceito os{' '}
                  <a href="/termos" target="_blank" className="underline" style={{ color: 'var(--color-primary)' }}>Termos de Uso</a>
                  {' '}e{' '}
                  <a href="/privacidade" target="_blank" className="underline" style={{ color: 'var(--color-primary)' }}>Política de Privacidade</a>
                </span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[var(--radius-sm)] text-sm font-display font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}
              >
                {loading ? 'Criando...' : 'Criar conta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
