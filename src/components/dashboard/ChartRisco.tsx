import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MOCK_DATA = [
  { name: 'Baixo', value: 18, color: '#2E8B57' },
  { name: 'Médio', value: 12, color: '#D4AF37' },
  { name: 'Alto', value: 7, color: '#E67E22' },
  { name: 'Crítico', value: 3, color: '#B22222' },
];

export function ChartRisco() {
  return (
    <div
      className="rounded-[var(--radius-md)] p-5"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Termômetro de Risco
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={MOCK_DATA} barSize={40}>
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
            {MOCK_DATA.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
