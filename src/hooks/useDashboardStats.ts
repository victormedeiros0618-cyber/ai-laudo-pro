/**
 * useDashboardStats.ts
 *
 * Substitui o useEffect + select(*) do Dashboard.tsx por queries focadas:
 *
 * 1. fetchKPIs — query leve: só lê `gravidade` e `conteudo_json->nivel_risco_geral`
 *    via .select('gravidade, conteudo_json->nivel_risco_geral') para calcular KPIs
 *    sem trazer o JSONB inteiro de cada laudo.
 *
 * 2. fetchAchados — query separada que traz `conteudo_json->achados` apenas quando
 *    o usuário precisa dos charts (lazy, staleTime longo).
 *
 * Separar as duas queries evita carregar o conteúdo pesado dos achados só para
 * mostrar os 4 KPI cards.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { AchadoTecnico } from '@/types';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalLaudos: number;
  patologiasTotal: number;
  riscoCritico: number;
  mediaPatologias: number;
}

export interface RiscoContagem {
  baixo: number;
  medio: number;
  alto: number;
  critico: number;
}

// ── Hook: KPIs (leve — sem conteudo_json completo) ────────────────────────────

export function useDashboardKPIs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'kpis', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) return { totalLaudos: 0, patologiasTotal: 0, riscoCritico: 0, mediaPatologias: 0 };

      // Traz apenas as colunas leves necessárias para os KPIs:
      // - gravidade: campo direto na tabela (indexado)
      // - conteudo_json->nivel_risco_geral: extração de campo específico do JSONB
      //   (muito mais leve do que trazer o JSON inteiro com todos os achados)
      const { data, error } = await supabase
        .from('laudos')
        .select(`
          gravidade,
          conteudo_json->nivel_risco_geral,
          conteudo_json->achados
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const rows = data ?? [];
      const totalLaudos = rows.length;

      let patologiasTotal = 0;
      let riscoCritico = 0;

      for (const row of rows) {
        // nivel_risco_geral vem como campo direto pela extração ->
        const nivelRisco = row['?column?'] as string | null ??
          (row as Record<string, unknown>)['nivel_risco_geral'] as string | null;

        if (nivelRisco === 'critico') riscoCritico++;

        // achados vem como array JSON
        const achados = (row as Record<string, unknown>)['achados'] as unknown[];
        if (Array.isArray(achados)) {
          patologiasTotal += achados.length;
        }
      }

      const mediaPatologias = totalLaudos > 0
        ? Number((patologiasTotal / totalLaudos).toFixed(1))
        : 0;

      return { totalLaudos, patologiasTotal, riscoCritico, mediaPatologias };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Hook: Dados para charts (separado, carregado após KPIs) ───────────────────

export function useDashboardCharts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'charts', user?.id],
    queryFn: async (): Promise<{
      achados: AchadoTecnico[];
      riscoContagem: RiscoContagem;
    }> => {
      if (!user) return { achados: [], riscoContagem: { baixo: 0, medio: 0, alto: 0, critico: 0 } };

      const { data, error } = await supabase
        .from('laudos')
        .select('conteudo_json->achados')
        .eq('user_id', user.id);

      if (error) throw error;

      const risco: RiscoContagem = { baixo: 0, medio: 0, alto: 0, critico: 0 };
      const todosAchados: AchadoTecnico[] = [];

      for (const row of data ?? []) {
        const rowAchados = (row as Record<string, unknown>)['achados'] as AchadoTecnico[] | null;
        if (!Array.isArray(rowAchados)) continue;

        todosAchados.push(...rowAchados);

        for (const a of rowAchados) {
          const g = a.gravidade as keyof RiscoContagem;
          if (g && g in risco) risco[g]++;
        }
      }

      return { achados: todosAchados, riscoContagem: risco };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
