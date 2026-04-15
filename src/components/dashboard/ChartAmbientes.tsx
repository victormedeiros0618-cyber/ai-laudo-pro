import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { Building2 } from 'lucide-react';
import type { AchadoTecnico } from '@/types';

/**
 * ChartAmbientes — Donut chart de distribuição de achados por ambiente.
 *
 * Paleta adaptativa:
 *   - Light: tons de azul/dourado VistorIA + contrastes
 *   - Dark:  paleta com neon + azul escurecido para manter contraste no preto
 */

const COLORS_LIGHT = [
  '#1E3A8A', // Azul primário
  '#DAA520', // Dourado
  '#3B82F6', // Azul claro
  '#F59E0B', // Âmbar
  '#10B981', // Verde
  '#DC2626', // Vermelho
  '#8B5CF6', // Roxo
  '#0891B2', // Ciano
];

const COLORS_DARK = [
  '#00D4FF', // Neon
  '#F4C430', // Dourado vivo
  '#60A5FA', // Azul claro
  '#FBBF24', // Âmbar claro
  '#34D399', // Verde claro
  '#F87171', // Vermelho claro
  '#A78BFA', // Roxo claro
  '#22D3EE', // Ciano
];

interface Props {
  achados: AchadoTecnico[];
}

export function ChartAmbientes({ achados }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;

  const contagem = achados.reduce<Record<string, number>>((acc, a) => {
    const setor = a.ambiente_setor || 'Não identificado';
    acc[setor] = (acc[setor] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(contagem)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const vazio = data.length === 0;

  return (
    <div className="rounded-xl p-5 bg-surface border border-border shadow-card transition-shadow hover:shadow-lg">
      <h3 className="font-display text-sm font-bold mb-4 text-text-primary flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary dark:text-[#00D4FF]" />
        Distribuição por Ambiente
      </h3>

      {vazio ? (
        <div className="flex flex-col items-center justify-center gap-2 h-[260px]">
          <Building2 className="h-10 w-10 text-text-disabled" strokeWidth={1.5} />
          <p className="text-sm text-text-muted">Nenhum achado registrado ainda</p>
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
              stroke={isDark ? '#151B2E' : '#FFFFFF'}
              strokeWidth={2}
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
                color: 'var(--color-text-primary)',
              }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
            />
            <Legend
              verticalAlign="bottom"
              iconSize={8}
              wrapperStyle={{
                fontSize: '11px',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
