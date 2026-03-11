import { useState } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartAmbientes } from '@/components/dashboard/ChartAmbientes';
import { ChartRisco } from '@/components/dashboard/ChartRisco';
import { BarChart3, AlertTriangle, AlertOctagon, Calculator } from 'lucide-react';

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('Todos os períodos');
  const [vistoriador, setVistoriador] = useState('Todos os vistoriadores');

  // Mock data
  const isLoading = false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          {['Todos os períodos', 'Este mês', 'Últimos 3 meses', 'Últimos 6 meses', 'Este ano'].map(o => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select
          value={vistoriador}
          onChange={(e) => setVistoriador(e.target.value)}
          className="px-3 py-2 rounded-[var(--radius-sm)] text-sm font-body"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <option>Todos os vistoriadores</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<BarChart3 size={18} />}
          title="Total de Laudos"
          value={47}
          subtitle="+3 este mês"
          isLoading={isLoading}
        />
        <KPICard
          icon={<AlertTriangle size={18} />}
          title="Patologias Identificadas"
          value={312}
          subtitle="média 6,6/laudo"
          isLoading={isLoading}
        />
        <KPICard
          icon={<AlertOctagon size={18} />}
          title="Risco Crítico"
          value={8}
          subtitle="requer atenção"
          danger
          isLoading={isLoading}
        />
        <KPICard
          icon={<Calculator size={18} />}
          title="Média/Laudo"
          value="6,6"
          subtitle="patologias"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartAmbientes />
        <ChartRisco />
      </div>
    </div>
  );
}
