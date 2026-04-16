import { Link } from 'react-router-dom';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartAmbientes } from '@/components/dashboard/ChartAmbientes';
import { ChartRisco } from '@/components/dashboard/ChartRisco';
import { KPICardsSkeleton, ChartSkeleton } from '@/components/ui/skeletons';
import { BarChart3, AlertTriangle, AlertOctagon, Calculator, Plus, Sparkles } from 'lucide-react';
import { useDashboardKPIs, useDashboardCharts } from '@/hooks/useDashboardStats';

export default function Dashboard() {
  const { data: stats, isLoading: kpisLoading, error: kpisError } = useDashboardKPIs();
  const { data: chartsData, isLoading: chartsLoading } = useDashboardCharts();

  const kpis = stats ?? { totalLaudos: 0, patologiasTotal: 0, riscoCritico: 0, mediaPatologias: 0 };
  const achados = chartsData?.achados ?? [];
  const riscoContagem = chartsData?.riscoContagem ?? { baixo: 0, medio: 0, alto: 0, critico: 0 };
  const isEmpty = !kpisLoading && kpis.totalLaudos === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-0.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary dark:text-[#00D4FF]" />
            Visão geral dos seus laudos técnicos
          </p>
        </div>
        <Link
          to="/novo-laudo"
          data-tour="dashboard-novo-laudo-cta"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover dark:hover:shadow-neon transition-all"
        >
          <Plus size={16} />
          Novo Laudo
        </Link>
      </div>

      {/* Erro */}
      {kpisError && (
        <div className="rounded-md px-4 py-3 text-sm bg-danger-light text-danger border border-danger">
          Erro ao carregar dados do dashboard. Verifique sua conexão e recarregue a página.
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !kpisError && (
        <EmptyStateDashboard />
      )}

      {/* KPI Cards */}
      {!isEmpty && (
        kpisLoading ? (
          <KPICardsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<BarChart3 size={18} />}
              title="Total de Laudos"
              value={kpis.totalLaudos}
              subtitle="gerados"
              accent="primary"
            />
            <KPICard
              icon={<AlertTriangle size={18} />}
              title="Patologias Identificadas"
              value={kpis.patologiasTotal}
              subtitle={`média ${kpis.mediaPatologias}/laudo`}
              accent="gold"
            />
            <KPICard
              icon={<AlertOctagon size={18} />}
              title="Risco Crítico"
              value={kpis.riscoCritico}
              subtitle={kpis.riscoCritico > 0 ? 'requer atenção' : 'nenhum'}
              danger={kpis.riscoCritico > 0}
            />
            <KPICard
              icon={<Calculator size={18} />}
              title="Média/Laudo"
              value={kpis.mediaPatologias.toString()}
              subtitle="patologias"
              accent="neon"
            />
          </div>
        )
      )}

      {/* Charts */}
      {!isEmpty && (
        chartsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartAmbientes achados={achados} />
            <ChartRisco riscoContagem={riscoContagem} />
          </div>
        )
      )}
    </div>
  );
}

/**
 * EmptyStateDashboard — Exibido quando o usuário ainda não tem laudos.
 * Convida o usuário a criar o primeiro laudo com destaque visual.
 */
function EmptyStateDashboard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-10 md:p-16 text-center animate-fade-in">
      {/* Glow decorativo */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 dark:opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Ícone com pulse */}
        <div className="inline-flex items-center justify-center mb-6">
          <span className="relative flex items-center justify-center w-16 h-16">
            <span className="absolute inset-0 rounded-full bg-primary/10 dark:bg-[#00D4FF]/10 animate-ping" style={{ animationDuration: '2.5s' }} />
            <span className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary dark:bg-[#00D4FF] text-white dark:text-[#0B0F1A] shadow-lg dark:shadow-neon">
              <Sparkles className="h-7 w-7" strokeWidth={2} />
            </span>
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
          Pronto para seu primeiro laudo?
        </h2>
        <p className="text-text-secondary mb-6 leading-relaxed">
          Suba as fotos da vistoria e deixe a IA identificar patologias,
          calcular GUT e gerar seu PDF técnico em minutos.
        </p>

        <Link
          to="/novo-laudo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover dark:hover:shadow-neon transition-all"
        >
          <Plus size={16} />
          Criar meu primeiro laudo
        </Link>
      </div>
    </div>
  );
}
