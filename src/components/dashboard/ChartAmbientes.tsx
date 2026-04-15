import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AchadoTecnico } from '@/types';

const COLORS = ['#005f73', '#D4AF37', '#0a9396', '#94d2bd', '#e9d8a6', '#ae2012', '#bb3e03', '#ca6702'];

interface Props {
  achados: AchadoTecnico[];
}

export function ChartAmbientes({ achados }: Props) {
  // Agrupar achados por ambiente_setor
  const contagem = achados.reduce<Record<string, number>>((acc, a) => {
    const setor = a.ambiente_setor || 'Não identificado';
    acc[setor] = (acc[setor] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(contagem)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 setores

  const vazio = data.length === 0;

  return (
    <div
      className="rounded-[var(--radius-md)] p-5"
      style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Distribuicao por Ambiente/Setor
      </h3>

      {vazio ? (
        <div className="flex items-center justify-center" style={{ height: 260 }}>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-muted)' }}>
            Nenhum achado registrado ainda
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
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
      )}
    </div>
  );
}
