import { ReactNode } from 'react';

interface KPICardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  /** Destaque de alerta (ex: risco crítico) */
  danger?: boolean;
  /** Acento visual: 'gold' (padrão), 'primary', 'neon' */
  accent?: 'gold' | 'primary' | 'neon';
  isLoading?: boolean;
}

/**
 * KPICard — Card de indicador no dashboard.
 *
 * Visual:
 *   - Barra lateral colorida (esquerda) conforme accent/danger
 *   - Hover: elevação + glow neon em dark mode
 *   - Loading: skeleton pulsando
 */
export function KPICard({
  icon,
  title,
  value,
  subtitle,
  danger,
  accent = 'gold',
  isLoading,
}: KPICardProps) {
  if (isLoading) {
    return (
      <div className="kpi-card rounded-xl p-5 animate-pulse bg-surface border-l-[5px] border-border shadow-card">
        <div className="h-4 w-24 rounded bg-border" />
        <div className="h-8 w-16 mt-3 rounded bg-border" />
        <div className="h-3 w-20 mt-2 rounded bg-border" />
      </div>
    );
  }

  // Cor da borda lateral
  const borderClass = danger
    ? 'border-danger'
    : accent === 'primary'
    ? 'border-primary'
    : accent === 'neon'
    ? 'border-primary dark:border-[#00D4FF] dark:shadow-neon'
    : 'border-accent';

  // Cor do ícone
  const iconWrapClass = danger
    ? 'text-danger bg-danger/10'
    : accent === 'primary'
    ? 'text-primary bg-primary/10'
    : accent === 'neon'
    ? 'text-primary bg-primary/10 dark:text-[#00D4FF] dark:bg-[#00D4FF]/10'
    : 'text-accent bg-accent/10';

  return (
    <div
      className={`
        kpi-card relative rounded-xl p-5 cursor-default
        bg-surface border-l-[5px] ${borderClass}
        shadow-card hover:shadow-lg transition-shadow
      `}
    >
      {/* Header: ícone + título */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`flex items-center justify-center w-8 h-8 rounded-md ${iconWrapClass}`}>
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {title}
        </span>
      </div>

      {/* Valor */}
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-text-primary tracking-tight">
          {value}
        </span>
        {danger && (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full bg-danger animate-pulse-danger"
            aria-label="Indicador de alerta"
          />
        )}
      </div>

      {/* Subtitle */}
      <p className="text-xs mt-1.5 text-text-muted">{subtitle}</p>
    </div>
  );
}
