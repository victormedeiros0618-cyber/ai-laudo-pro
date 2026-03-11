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
    label: 'Histórico',
    icon: History,
    children: [
      { label: 'Todos os laudos', path: '/historico' },
      { label: 'Por vistoriador', path: '/historico?view=vistoriador' },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Identidade Visual', path: '/configuracoes?tab=identidade' },
      { label: 'Vistoriadores', path: '/configuracoes?tab=vistoriadores' },
      { label: 'Textos Padrão', path: '/configuracoes?tab=textos' },
    ],
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path || location.pathname + location.search === path;

  const toggleAccordion = (label: string) => {
    setActiveMenu(prev => (prev === label ? null : label));
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
            Engenharia AI
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Laudos Inteligentes</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded" style={{ color: 'var(--color-text-muted)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isExpanded = activeMenu === item.label;

          if (!hasChildren) {
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.path!); onClose(); }}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-body transition-colors"
                style={{
                  background: isActive(item.path!) ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive(item.path!) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderLeft: isActive(item.path!) ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path!)) e.currentTarget.style.background = '#F7FAFB';
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path!)) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleAccordion(item.label)}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-body transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F7FAFB'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isExpanded && (
                <div className="ml-10 border-l" style={{ borderColor: 'var(--color-border)' }}>
                  {item.children!.map((child) => (
                    <button
                      key={child.path}
                      onClick={() => { navigate(child.path); onClose(); }}
                      className="w-full text-left px-4 py-2 text-xs font-body transition-colors"
                      style={{
                        color: isActive(child.path) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        background: isActive(child.path) ? 'var(--color-primary-light)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F7FAFB'; }}
                      onMouseLeave={(e) => {
                        if (!isActive(child.path)) e.currentTarget.style.background = 'transparent';
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
          onClick={() => navigate('/planos')}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display font-semibold transition-colors"
          style={{
            color: 'var(--color-accent-dark)',
            background: 'var(--color-accent-light)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-accent-light)'; e.currentTarget.style.color = 'var(--color-accent-dark)'; }}
        >
          <Award size={14} />
          Fazer Upgrade
        </button>
      </div>
    </div>
  );
}
