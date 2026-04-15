import { KPICard } from '@/components/dashboard/KPICard';
import { ChartAmbientes } from '@/components/dashboard/ChartAmbientes';
import { ChartRisco } from '@/components/dashboard/ChartRisco';
import { KPICardsSkeleton, ChartSkeleton } from '@/components/ui/skeletons';
import { BarChart3, AlertTriangle, AlertOctagon, Calculator } from 'lucide-react';
import { useDashboardKPIs, useDashboardCharts } from '@/hooks/useDashboardStats';

export default function Dashboard() {
  // KPIs: query leve — sem conteudo_json completo
  const { data: stats, isLoading: kpisLoading, error: kpisError } = useDashboardKPIs();

  // Charts: query separada — carrega achados para os gráficos
  const { data: chartsData, isLoading: chartsLoading } = useDashboardCharts();

  const kpis = stats ?? { totalLaudos: 0, patologiasTotal: 0, riscoCritico: 0, mediaPatologias: 0 };
  const achados = chartsData?.achados ?? [];
  const riscoContagem = chartsData?.riscoContagem ?? { baixo: 0, medio: 0, alto: 0, critico: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
      </div>

      {/* Erro de carregamento */}
      {kpisError && (
        <div
          className="rounded-[var(--radius-sm)] px-4 py-3 text-sm font-body"
          style={{ background: 'var(--color-danger-light, #FDEDEC)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
        >
          Erro ao carregar dados do dashboard. Verifique sua conexão e recarregue a página.
        </div>
      )}

      {/* KPI Cards */}
      {kpisLoading ? (
        <KPICardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<BarChart3 size={18} />}
            title="Total de Laudos"
            value={kpis.totalLaudos}
            subtitle="total"
            isLoading={false}
          />
          <KPICard
            icon={<AlertTriangle size={18} />}
            title="Patologias Identificadas"
            value={kpis.patologiasTotal}
            subtitle={`média ${kpis.mediaPatologias}/laudo`}
            isLoading={false}
          />
          <KPICard
            icon={<AlertOctagon size={18} />}
            title="Risco Crítico"
            value={kpis.riscoCritico}
            subtitle={kpis.riscoCritico > 0 ? 'requer atenção' : 'nenhum'}
            danger={kpis.riscoCritico > 0}
            isLoading={false}
          />
          <KPICard
            icon={<Calculator size={18} />}
            title="Média/Laudo"
            value={kpis.mediaPatologias.toString()}
            subtitle="patologias"
            isLoading={false}
          />
        </div>
      )}

      {/* Charts */}
      {chartsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartAmbientes achados={achados} />
          <ChartRisco riscoContagem={riscoContagem} />
        </div>
      )}
    </div>
  );
}
