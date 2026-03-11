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
  status: 'draft' | 'emitido';
}

export type TipoVistoria =
  | 'Vistoria Técnica'
  | 'Inspeção Predial'
  | 'Perícia Judicial'
  | 'Laudo Cautelar'
  | 'Laudo de Reforma'
  | 'Laudo de Avaliação';

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

export interface Vistoriador {
  id: string;
  nome: string;
  cargo: string;
  crea_cau: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_id: 'free' | 'basico' | 'pro' | 'escritorio';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  laudos_used: number;
  laudos_limit: number;
  current_period_end?: string;
}

export const PRAZOS_CRM: Record<string, number | null> = {
  'Inspeção Predial':  3 * 365,
  'Laudo Cautelar':    2 * 365,
  'Laudo de Reforma':  180,
  'Vistoria Técnica':  365,
  'Laudo de Avaliação':365,
  'Perícia Judicial':  null,
};

export const GRAVIDADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  baixo:   { bg: '#EAFAF1', text: '#1A7340', border: '#1A7340' },
  medio:   { bg: '#FEF5EC', text: '#E67E22', border: '#E67E22' },
  alto:    { bg: '#FDF3E7', text: '#C0392B', border: '#E67E22' },
  critico: { bg: '#FDEDEC', text: '#C0392B', border: '#C0392B' },
};

export interface BadgeCRMData {
  label: string;
  color: string;
  bg: string;
  icon: string;
}
