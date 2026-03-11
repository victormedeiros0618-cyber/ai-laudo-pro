export function PlanWidget() {
  // Mock data - will be replaced with useSubscription hook
  const usagePercent = 40;
  const planLabel = 'Gratuito';
  const laudosUsed = 0;
  const laudosLimit = 2;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - usagePercent / 100);

  const strokeColor = usagePercent >= 90 ? 'var(--color-danger)'
    : usagePercent >= 70 ? 'var(--color-warning)'
    : 'var(--color-primary)';

  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64">
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
          {usagePercent}%
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
