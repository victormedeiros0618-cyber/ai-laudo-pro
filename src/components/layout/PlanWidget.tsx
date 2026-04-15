import { useEffect } from 'react';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAuth } from '@/hooks/useAuth';

export function PlanWidget() {
  const { user } = useAuth();
  const { subscription, carregarSubscription, obterPlanoAtual, obterProgressoLaudos } = useSubscriptions();

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

  const strokeColor = usagePercent >= 90 ? 'var(--color-danger)'
    : usagePercent >= 70 ? 'var(--color-warning)'
    : 'var(--color-primary)';

  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="5"
        />
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="32" y="32"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display"
          style={{ fontSize: '12px', fontWeight: 700, fill: 'var(--color-text-primary)' }}
        >
          {Math.round(usagePercent)}%
        </text>
      </svg>
      <div>
        <p className="font-display text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {planLabel}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {laudosUsed} de {laudosLimit} laudos
        </p>
      </div>
    </div>
  );
}
