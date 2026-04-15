import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, History, Settings,
  ChevronDown, ChevronRight, X, Award
} from 'lucide-react';
import { PlanWidget } from './PlanWidget';

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

  const isActive = (path: string) => location.pathname === path || location.pathname + location.search === path;

  const toggleAccordion = (label: string) => {
    setActiveMenu((prev) => (prev === label ? null : label));
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: 'var(--color-surface)',
        borderRight: 'var(--sidebar-border)',
        width: 'var(--sidebar-width)',
      }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 className="font-display text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
            VistorIA
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Laudos Inteligentes</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1 rounded"
          style={{ color: 'var(--color-text-muted)' }}
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
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  navigate(item.path!);
                  onClose();
                }}
                data-active={isActive(item.path!) || undefined}
                className="sidebar-nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm font-body"
                style={{
                  background: isActive(item.path!) ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive(item.path!) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderLeft: isActive(item.path!) ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
              >
                {Icon && <Icon size={18} />}
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
                className="sidebar-nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm font-body"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {Icon && <Icon size={18} />}
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="ml-10 border-l" style={{ borderColor: 'var(--color-border)' }}>
                  {item.children!.map((child) => (
                    <button
                      type="button"
                      key={child.path}
                      onClick={() => {
                        navigate(child.path);
                        onClose();
                      }}
                      data-active={isActive(child.path) || undefined}
                      className="sidebar-nav-item w-full text-left px-4 py-2 text-xs font-body"
                      style={{
                        color: isActive(child.path) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        background: isActive(child.path) ? 'var(--color-primary-light)' : 'transparent',
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Plan widget + upgrade */}
      <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <PlanWidget />
        <button
          type="button"
          onClick={() => navigate('/planos')}
          className="sidebar-upgrade-btn w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display font-semibold"
          style={{
            color: 'var(--color-accent-dark)',
            background: 'var(--color-accent-light)',
          }}
        >
          <Award size={14} />
          Fazer Upgrade
        </button>
      </div>
    </div>
  );
}
