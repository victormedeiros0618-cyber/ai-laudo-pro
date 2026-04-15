import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface TopBarProps {
  onMenuClick: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/novo-laudo': 'Novo Laudo',
  '/historico': 'Histórico',
  '/configuracoes': 'Configurações',
  '/planos': 'Planos',
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const breadcrumb = BREADCRUMB_MAP[location.pathname] || 'Painel';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🔵 TopBar: Logout clicado');
      setIsLoggingOut(true);
      setPopoverOpen(false);

      // Chamar signOut do useAuth (que faz o logout no Supabase)
      await signOut();

      console.log('🟢 TopBar: Logout sucesso');
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('🔴 TopBar: Erro no logout:', error);
      toast.error('Erro ao fazer logout');
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-4 sticky top-0 z-30"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} title="Abrir menu" aria-label="Abrir menu" className="lg:hidden p-2 rounded-md" style={{ color: 'var(--color-text-secondary)' }}>
          <Menu size={20} />
        </button>
        <span className="font-display text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {breadcrumb}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-bold transition-shadow hover:shadow-md"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
          }}
        >
          U
        </button>

        {popoverOpen && (
          <div
            className="absolute right-0 top-10 w-48 rounded-md py-1 z-50"
            style={{
              background: 'var(--color-surface)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="px-4 py-2 text-xs font-body" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
              Usuário
            </div>
            <button
              onClick={() => { navigate('/configuracoes'); setPopoverOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-body hover:bg-gray-50"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <User size={14} /> Minha conta
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-body hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--color-danger)' }}
            >
              <LogOut size={14} /> {isLoggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}