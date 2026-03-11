import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MOCK_DATA = [
  { name: 'Fachada', value: 12 },
  { name: 'Cobertura', value: 8 },
  { name: 'Estrutura', value: 6 },
  { name: 'Instalações', value: 5 },
  { name: 'Garagem', value: 4 },
  { name: 'Áreas Comuns', value: 3 },
];

const COLORS = ['#005f73', '#D4AF37', '#0a9396', '#94d2bd', '#e9d8a6', '#ae2012'];

export function ChartAmbientes() {
  return (
    <div
      className="rounded-[var(--radius-md)] p-5"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Distribuição por Ambiente/Setor
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={MOCK_DATA}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            stroke="none"
          >
            {MOCK_DATA.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-body)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
