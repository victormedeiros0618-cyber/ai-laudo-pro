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
  const { signOut, user } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const breadcrumb = BREADCRUMB_MAP[location.pathname] || 'Painel';
  // Iniciais do usuário para o avatar (U como fallback)
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

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
      setIsLoggingOut(true);
      setPopoverOpen(false);
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-4 sticky top-0 z-30 bg-surface border-b border-border backdrop-blur-sm"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          title="Abrir menu"
          aria-label="Abrir menu"
          className="lg:hidden p-2 rounded-md text-text-secondary hover:text-primary dark:hover:text-[#00D4FF] transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="font-display text-sm font-semibold text-text-primary">
          {breadcrumb}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setPopoverOpen(!popoverOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-display text-xs font-bold bg-primary text-white transition-all hover:shadow-md dark:hover:shadow-neon hover:ring-2 hover:ring-offset-2 hover:ring-offset-surface hover:ring-primary/40 dark:hover:ring-[#00D4FF]/40"
            aria-label="Menu do usuário"
            aria-expanded={popoverOpen}
          >
            {initials}
          </button>

          {popoverOpen && (
            <div className="absolute right-0 top-11 w-56 rounded-lg py-1 z-50 bg-surface-raised border border-border shadow-lg animate-fade-in overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs text-text-muted">Conectado como</p>
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.email || 'Usuário'}
                </p>
              </div>
              <button
                onClick={() => { navigate('/configuracoes'); setPopoverOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-primary/5 dark:hover:bg-[#00D4FF]/10 transition-colors"
              >
                <User size={14} /> Minha conta
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-light/50 dark:hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
