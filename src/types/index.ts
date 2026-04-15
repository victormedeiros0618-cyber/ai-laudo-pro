/**
 * types/index.ts — CORRIGIDO
 *
 * MUDANÇAS:
 * 1. PlanId unificado: estava divergente entre este arquivo (free/basico/pro/escritorio)
 *    e useSubscriptions.ts (free/pro/enterprise). Definido aqui como fonte da verdade.
 *    AJUSTE: confirme com o time qual nomenclatura é a correta no Stripe/Supabase
 *    e mude APENAS aqui — useSubscriptions.ts já importa daqui.
 *
 * 2. Adicionado tipo AppUser para tipar o usuário em vez de `any` no useAuth.
 */

// ─── Usuário ──────────────────────────────────────────────────────────────────

/**
 * Subconjunto do User do Supabase que usamos na aplicação.
 * Evita `any` no useAuth e dá autocomplete em todo o projeto.
 */
export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  created_at?: string;
}

// ─── Laudos ───────────────────────────────────────────────────────────────────

export interface AchadoTecnico {
  ambiente_setor: string;
  titulo_patologia: string;
  descricao_tecnica: string;
  gravidade: 'baixo' | 'medio' | 'alto' | 'critico';
  nota_g: number;
  nota_u: number;
  nota_t: number;
  gut_score: number;
  estimativa_custo: string;
  norma_nbr_relacionada: string;
  provavel_causa: string;
  recomendacao_intervencao: string;
}

export interface RelatorioIA {
  achados: AchadoTecnico[];
  resumo_executivo: string;
  nivel_risco_geral: 'baixo' | 'medio' | 'alto' | 'critico';
}

export interface Laudo {
  id: string;
  user_id: string;
  created_at: string;
  titulo?: string;
  cliente: string;
  endereco?: string;
  gravidade?: string;
  tipo_vistoria: TipoVistoria;
  responsavel?: string;
  data_vistoria: string;
  conteudo_json: RelatorioIA | Record<string, unknown>;
  pdf_url?: string;
  status: 'draft' | 'finalizado' | 'assinado';
}

export type TipoVistoria =
  | 'Vistoria Técnica'
  | 'Inspeção Predial'
  | 'Perícia Judicial'
  | 'Laudo Cautelar'
  | 'Laudo de Reforma'
  | 'Laudo de Avaliação';

// ─── Configurações ────────────────────────────────────────────────────────────

export interface Vistoriador {
  id: string;
  nome: string;
  cargo: string;
  crea_cau: string;
}

export interface Configuracoes {
  id: string;
  user_id: string;
  cor_primaria: string;
  texto_metodologia?: string;
  texto_conclusao?: string;
  vistoriadores: Vistoriador[];
  logo_url?: string;
  assinatura_url?: string;
}

// ─── Planos / Assinatura ──────────────────────────────────────────────────────

/**
 * FONTE DA VERDADE para IDs de plano.
 * FIX: estava divergente entre types/index.ts e useSubscriptions.ts.
 *
 * ⚠️  Confirme aqui qual nomenclatura está no seu banco Supabase/Stripe
 *     e ajuste se necessário — basta mudar neste arquivo.
 *
 * Opção A (conforme useSubscriptions.ts):  'free' | 'pro' | 'enterprise'
 * Opção B (conforme types/index.ts antigo): 'free' | 'basico' | 'pro' | 'escritorio'
 */
export type PlanId = 'free' | 'pro' | 'enterprise'; // ← ajuste conforme seu banco

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_id: PlanId;                                    // usa PlanId centralizado
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  laudos_used: number;
  laudos_limit: number;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const PRAZOS_CRM: Record<TipoVistoria, number | null> = {
  'Vistoria Técnica': 30,
  'Inspeção Predial': 3 * 365,
  'Perícia Judicial': 2 * 365,
  'Laudo Cautelar': 2 * 365,
  'Laudo de Reforma': 180,
  'Laudo de Avaliação': 90,
};

export const GRAVIDADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  baixo: { bg: '#EAFAF1', text: '#1A7340', border: '#1A7340' },
  medio: { bg: '#FEF5EC', text: '#E67E22', border: '#E67E22' },
  alto: { bg: '#FDF3E7', text: '#C0392B', border: '#E67E22' },
  critico: { bg: '#FDEDEC', text: '#C0392B', border: '#C0392B' },
};

export interface BadgeCRMData {
  label: string;
  color: string;
  bg: string;
  icon: string;
}
