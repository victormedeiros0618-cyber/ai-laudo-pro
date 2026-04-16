/**
 * constants.ts — Valores centralizados do projeto
 *
 * Todos os valores que antes estavam hardcoded em hooks, componentes
 * e edge functions estão centralizados aqui.
 */

// ─── Upload / Imagens ────────────────────────────────────────
export const MAX_FOTO_SIZE_MB = 10;
export const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024;
export const MAX_LOGO_SIZE_MB = 5;
export const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Batch Processing ────────────────────────────────────────
export const BATCH_SIZE = 3;
export const GEMINI_TIMEOUT_MS = 90_000; // 90s para análise de imagens
export const GEMINI_MAX_RETRIES = 2;

// ─── Auto-save ───────────────────────────────────────────────
export const AUTOSAVE_DEBOUNCE_MS = 1_000;

// ─── Offline Queue ───────────────────────────────────────────
export const INDEXEDDB_NAME = 'EngenhariAI_Photos';
export const INDEXEDDB_STORE = 'photos_queue';
export const OFFLINE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

// ─── PDF ─────────────────────────────────────────────────────
export const PDF_MAX_FOTOS = 10;
/**
 * @deprecated Paleta legada. Novos componentes devem usar `src/lib/pdf/theme.ts`.
 * Mantido para não quebrar imports existentes.
 */
export const PDF_COLORS = {
    primary: [30, 58, 138] as [number, number, number],    // #1E3A8A — Azul VistorIA
    dark: [55, 65, 81] as [number, number, number],        // #374151 — Cinza escuro
    light: [243, 244, 246] as [number, number, number],    // #F3F4F6 — Cinza claro
    muted: [156, 163, 175] as [number, number, number],    // #9CA3AF — Muted
};

// ─── Planos ──────────────────────────────────────────────────
export const FREE_PLAN_LIMIT = 2;
export const PRO_PLAN_LIMIT = 50;
export const ENTERPRISE_PLAN_LIMIT = 999;

// ─── UI ──────────────────────────────────────────────────────
export const MOBILE_BREAKPOINT = 768;

// ─── LGPD ────────────────────────────────────────────────────
export const TERMS_VERSION = 'v1.0';
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

// ─── Custos IA (para prompt engineering) ─────────────────────
export const CUSTO_TIERS = {
    baixo: 'R$ 5.000',
    medio: 'R$ 5.000 - R$ 20.000',
    alto: 'R$ 20.000',
} as const;
