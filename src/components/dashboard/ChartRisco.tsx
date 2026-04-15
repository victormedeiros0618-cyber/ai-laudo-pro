import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  riscoContagem: { baixo: number; medio: number; alto: number; critico: number };
}

const RISK_CONFIG = [
  { name: 'Baixo', key: 'baixo' as const, color: '#2E8B57' },
  { name: 'Medio', key: 'medio' as const, color: '#D4AF37' },
  { name: 'Alto', key: 'alto' as const, color: '#E67E22' },
  { name: 'Critico', key: 'critico' as const, color: '#B22222' },
];

export function ChartRisco({ riscoContagem }: Props) {
  const data = RISK_CONFIG.map(r => ({
    name: r.name,
    value: riscoContagem[r.key],
    color: r.color,
  }));

  const vazio = data.every(d => d.value === 0);

  return (
    <div
      className="rounded-[var(--radius-md)] p-5"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Termometro de Risco
      </h3>

      {vazio ? (
        <div className="flex items-center justify-center" style={{ height: 260 }}>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-muted)' }}>
            Nenhum dado de risco disponivel
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barSize={40}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
