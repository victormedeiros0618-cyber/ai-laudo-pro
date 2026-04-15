import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { Gauge } from 'lucide-react';

/**
 * ChartRisco — Termômetro de risco por gravidade GUT.
 *
 * Paleta semântica (light/dark) alinhada ao design system.
 */

interface Props {
  riscoContagem: { baixo: number; medio: number; alto: number; critico: number };
}

const RISK_CONFIG_LIGHT = [
  { name: 'Baixo',    key: 'baixo'    as const, color: '#10B981' },
  { name: 'Médio',    key: 'medio'    as const, color: '#DAA520' },
  { name: 'Alto',     key: 'alto'     as const, color: '#F59E0B' },
  { name: 'Crítico',  key: 'critico'  as const, color: '#DC2626' },
];

const RISK_CONFIG_DARK = [
  { name: 'Baixo',    key: 'baixo'    as const, color: '#34D399' },
  { name: 'Médio',    key: 'medio'    as const, color: '#F4C430' },
  { name: 'Alto',     key: 'alto'     as const, color: '#FBBF24' },
  { name: 'Crítico',  key: 'critico'  as const, color: '#F87171' },
];

export function ChartRisco({ riscoContagem }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const RISK_CONFIG = isDark ? RISK_CONFIG_DARK : RISK_CONFIG_LIGHT;

  const data = RISK_CONFIG.map(r => ({
    name: r.name,
    value: riscoContagem[r.key],
    color: r.color,
  }));

  const vazio = data.every(d => d.value === 0);

  return (
    <div className="rounded-xl p-5 bg-surface border border-border shadow-card transition-shadow hover:shadow-lg">
      <h3 className="font-display text-sm font-bold mb-4 text-text-primary flex items-center gap-2">
        <Gauge className="h-4 w-4 text-primary dark:text-[#00D4FF]" />
        Termômetro de Risco
      </h3>

      {vazio ? (
        <div className="flex flex-col items-center justify-center gap-2 h-[260px]">
          <Gauge className="h-10 w-10 text-text-disabled" strokeWidth={1.5} />
          <p className="text-sm text-text-muted">Nenhum dado de risco disponível</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barSize={48} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              cursor={{ fill: isDark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(30, 58, 138, 0.05)' }}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
              }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
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
