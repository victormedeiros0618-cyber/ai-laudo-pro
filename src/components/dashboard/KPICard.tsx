import { ReactNode } from 'react';

interface KPICardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  danger?: boolean;
  isLoading?: boolean;
}

export function KPICard({ icon, title, value, subtitle, danger, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-[var(--radius-md)] p-5 animate-pulse"
        style={{
          background: 'var(--color-surface)',
          borderLeft: '5px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="h-4 w-24 rounded" style={{ background: 'var(--color-border)' }} />
        <div className="h-8 w-16 mt-3 rounded" style={{ background: 'var(--color-border)' }} />
        <div className="h-3 w-20 mt-2 rounded" style={{ background: 'var(--color-border)' }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-md)] p-5 cursor-default group"
      style={{
        background: 'var(--color-surface)',
        borderLeft: `5px solid ${danger ? 'var(--color-danger)' : 'var(--color-accent)'}`,
        boxShadow: 'var(--shadow-card)',
        transition: 'transform var(--transition), box-shadow var(--transition)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.borderLeftWidth = '7px';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderLeftWidth = '5px';
      }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {icon}
        <span className="font-display text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {value}
        </span>
        {danger && (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full animate-pulse-danger"
            style={{ background: 'var(--color-danger)' }}
          />
        )}
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
    </div>
  );
}
