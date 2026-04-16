/**
 * theme.ts — Paleta VistorIA + tipografia + espaçamentos para PDF
 *
 * Centraliza todas as constantes visuais do PDF profissional.
 * Qualquer componente PDF importa daqui — nunca hardcoda valores.
 */

// ─── Cores (RGB tuples para jsPDF) ────────────────────────────────────────────

export const COLORS = {
  /** Azul primário — headers, faixas, CTAs */
  primary: [30, 58, 138] as const,     // #1E3A8A
  /** Dourado metálico — bordas, acentos */
  gold: [218, 165, 32] as const,       // #DAA520
  /** Cinza escuro — textos corpo */
  dark: [55, 65, 81] as const,         // #374151
  /** Cinza claro — fundos alternados */
  light: [243, 244, 246] as const,     // #F3F4F6
  /** Cinza muted — rodapé, labels secundários */
  muted: [156, 163, 175] as const,     // #9CA3AF
  /** Branco */
  white: [255, 255, 255] as const,
  /** Preto */
  black: [0, 0, 0] as const,

  // Severidades (para badges, FindingCard etc.)
  severidade: {
    baixo:   { bg: [234, 250, 241] as const, text: [26, 115, 64] as const },   // green
    medio:   { bg: [254, 245, 236] as const, text: [230, 126, 34] as const },  // orange
    alto:    { bg: [253, 243, 231] as const, text: [192, 57, 43] as const },   // red-orange
    critico: { bg: [253, 237, 236] as const, text: [192, 57, 43] as const },   // red
  },
} as const;

export type RGBTuple = readonly [number, number, number];
export type Severidade = keyof typeof COLORS.severidade;

// ─── Tipografia ───────────────────────────────────────────────────────────────

export const FONT = {
  family: 'Inter',
  size: {
    /** Título de capa */
    title: 20,
    /** Título de seção (RESUMO EXECUTIVO etc.) */
    sectionTitle: 13,
    /** Subtítulo / label (campo info) */
    subtitle: 11,
    /** Corpo — texto principal */
    body: 10,
    /** Detalhe — labels secundários, rodapé */
    small: 9,
    /** Micro — número de página, timestamps */
    micro: 8,
  },
  lineHeight: {
    /** Multiplicador para corpo de texto */
    body: 1.5,
    /** Multiplicador para títulos */
    heading: 1.2,
    /** Espaçamento compacto (listas, detalhes) */
    compact: 1.3,
  },
} as const;

// ─── Layout (mm) ──────────────────────────────────────────────────────────────

export const LAYOUT = {
  page: {
    width: 210,   // A4
    height: 297,  // A4
  },
  margin: {
    top: 25,
    bottom: 20,
    left: 20,
    right: 20,
  },
  /** Área útil de conteúdo */
  get contentWidth() {
    return this.page.width - this.margin.left - this.margin.right;
  },
  /** Y onde o conteúdo começa (abaixo do header) */
  contentStartY: 30,
  /** Y máximo antes de forçar pagebreak (acima do footer) */
  contentEndY: 280,
  /** Espaçamento vertical entre seções */
  sectionGap: 12,
  /** Espaçamento vertical entre parágrafos */
  paragraphGap: 6,
  /** Indent para listas */
  indent: 4,
} as const;

// ─── Header / Footer ─────────────────────────────────────────────────────────

export const HEADER = {
  /** Espessura da linha horizontal abaixo do header */
  lineWidth: 0.5,
  /** Cor da linha */
  lineColor: COLORS.muted,
  /** Y da linha */
  lineY: 22,
} as const;

export const FOOTER = {
  /** Y do texto do rodapé */
  textY: 290,
  /** Tamanho da fonte */
  fontSize: FONT.size.micro,
  /** Cor */
  color: COLORS.muted,
} as const;
