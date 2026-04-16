import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, History, Settings,
  ChevronDown, ChevronRight, X, Award
} from 'lucide-react';
import { PlanWidget } from './PlanWidget';
import { Logo } from '@/assets/logo';

interface SidebarProps {
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Novo Laudo', icon: FilePlus, path: '/novo-laudo' },
  {
    label: 'Historico',
    icon: History,
    children: [
      { label: 'Todos', path: '/historico' },
      { label: 'Por Vistoriador', path: '/historico?view=vistoriador' },
    ],
  },
  {
    label: 'Configuracoes',
    icon: Settings,
    children: [
      { label: 'Identidade Visual', path: '/configuracoes?section=identidade' },
      { label: 'Assinatura Digital', path: '/configuracoes?section=assinatura' },
      { label: 'Vistoriadores', path: '/configuracoes?section=vistoriadores' },
      { label: 'Textos Padrao', path: '/configuracoes?section=textos' },
    ],
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname + location.search === path;

  const toggleAccordion = (label: string) => {
    setActiveMenu((prev) => (prev === label ? null : label));
  };

  return (
    <div
      className="h-full flex flex-col bg-surface border-r border-border"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-border">
        <button
          type="button"
          onClick={() => { navigate('/dashboard'); onClose(); }}
          className="flex flex-col items-start gap-0.5 transition-opacity hover:opacity-80"
          aria-label="VistorIA — Ir para o dashboard"
        >
          <Logo
            className="h-9 w-auto"
            textColor="var(--color-primary)"
            accentColor="var(--color-accent)"
          />
          <p className="text-[10px] tracking-widest uppercase text-text-muted">
            Laudos Inteligentes
          </p>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1 rounded text-text-muted hover:text-text-primary transition-colors"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isExpanded = activeMenu === item.label;

          if (!hasChildren) {
            const active = isActive(item.path!);
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => { navigate(item.path!); onClose(); }}
                data-active={active || undefined}
                data-tour={
                  item.path === '/dashboard' ? 'nav-dashboard' :
                  item.path === '/novo-laudo' ? 'nav-novo-laudo' :
                  undefined
                }
                className={`
                  sidebar-nav-item relative w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium
                  ${active
                    ? 'text-primary bg-primary/10 dark:text-[#00D4FF] dark:bg-[#00D4FF]/10'
                    : 'text-text-secondary hover:text-primary dark:hover:text-[#00D4FF]'}
                `}
              >
                {/* Barra neon lateral no item ativo */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-primary dark:bg-[#00D4FF] dark:shadow-neon"
                  />
                )}
                {Icon && <Icon size={18} strokeWidth={active ? 2.5 : 2} />}
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleAccordion(item.label)}
                aria-expanded={isExpanded ? 'true' : 'false'}
                data-tour={
                  item.label === 'Historico' ? 'nav-historico' :
                  item.label === 'Configuracoes' ? 'nav-configuracoes' :
                  undefined
                }
                className="sidebar-nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-primary dark:hover:text-[#00D4FF]"
              >
                {Icon && <Icon size={18} />}
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="ml-10 border-l border-border">
                  {item.children!.map((child) => {
                    const active = isActive(child.path);
                    return (
                      <button
                        type="button"
                        key={child.path}
                        onClick={() => { navigate(child.path); onClose(); }}
                        data-active={active || undefined}
                        className={`
                          sidebar-nav-item w-full text-left px-4 py-2 text-xs font-medium
                          ${active
                            ? 'text-primary bg-primary/10 dark:text-[#00D4FF] dark:bg-[#00D4FF]/10'
                            : 'text-text-muted hover:text-primary dark:hover:text-[#00D4FF]'}
                        `}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Plan widget + upgrade */}
      <div className="p-4 border-t border-border">
        <PlanWidget />
        <button
          type="button"
          onClick={() => { navigate('/planos'); onClose(); }}
          data-tour="nav-planos"
          className="sidebar-upgrade-btn w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold bg-accent/10 text-accent-dark hover:bg-accent hover:text-[#0B0F1A] hover:shadow-gold transition-all"
        >
          <Award size={14} />
          Fazer Upgrade
        </button>
      </div>
    </div>
  );
}
