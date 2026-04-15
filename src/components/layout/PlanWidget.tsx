import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/hooks/useAuth';

/**
 * PlanWidget — Indicador de plano e consumo de laudos.
 *
 * Anel circular com gradiente (primário → neon no dark / primário → accent no light).
 * Cores mudam conforme percentual: >90% danger, >70% warning.
 */

export function PlanWidget() {
  const { user } = useAuth();
  const { subscription, carregarSubscription, obterPlanoAtual, obterProgressoLaudos } = useSubscriptions();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (user && !subscription) {
      carregarSubscription();
    }
  }, [user, subscription, carregarSubscription]);

  const plano = obterPlanoAtual();
  const progresso = obterProgressoLaudos();

  const planLabel = plano?.nome || 'Gratuito';
  const laudosUsed = progresso?.usado ?? 0;
  const laudosLimit = progresso?.limite ?? 2;
  const usagePercent = progresso?.percentual ?? 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(usagePercent, 100) / 100);

  // Cor dinâmica do ring
  const strokeColor =
    usagePercent >= 90 ? 'url(#progress-danger)'
    : usagePercent >= 70 ? 'url(#progress-warning)'
    : 'url(#progress-primary)';

  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="progress-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#3B5BDB' : '#1E3A8A'} />
            <stop offset="100%" stopColor={isDark ? '#00D4FF' : '#3B82F6'} />
          </linearGradient>
          <linearGradient id="progress-warning" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="progress-danger" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>

        {/* Track (fundo) */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="5"
        />

        {/* Progresso */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />

        <text
          x="32"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          style={{ fontSize: '12px', fontWeight: 700, fill: 'var(--color-text-primary)' }}
        >
          {Math.round(usagePercent)}%
        </text>
      </svg>

      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-text-primary truncate">
          {planLabel}
        </p>
        <p className="text-xs text-text-muted">
          {laudosUsed} de {laudosLimit} laudos
        </p>
      </div>
    </div>
  );
}
