-- ============================================================
-- 003_indexes.sql — Indexes de performance
-- Criado em: 2026-04-08
-- Descrição: Indexes para queries frequentes da aplicação
-- ============================================================

-- ─── laudos ─────────────────────────────────────────────────
-- Listagem de laudos do usuário ordenados por data (useLaudos.listarLaudos)
CREATE INDEX IF NOT EXISTS idx_laudos_user_created
    ON laudos (user_id, created_at DESC);

-- Filtro por status (Historico.tsx)
CREATE INDEX IF NOT EXISTS idx_laudos_user_status
    ON laudos (user_id, status);

-- Filtro por tipo de vistoria (Historico.tsx)
CREATE INDEX IF NOT EXISTS idx_laudos_user_tipo
    ON laudos (user_id, tipo_vistoria);

-- ─── subscriptions ──────────────────────────────────────────
-- Lookup rápido por user_id (já tem UNIQUE constraint, mas explicitando)
-- A UNIQUE constraint em user_id já cria um índice implícito

-- Lookup por stripe_customer_id (para webhooks do Stripe)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
    ON subscriptions (stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

-- ─── audit_log ──────────────────────────────────────────────
-- Listagem de logs do usuário por data (useAuditLog.listarLogs)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
    ON audit_log (user_id, created_at DESC);

-- Filtro por ação (useAuditLog.listarLogsPorAcao)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action
    ON audit_log (user_id, action, created_at DESC);

-- Filtro por recurso (useAuditLog.listarLogsPorRecurso)
CREATE INDEX IF NOT EXISTS idx_audit_log_resource
    ON audit_log (resource_id, created_at DESC)
    WHERE resource_id IS NOT NULL;

-- ─── ia_logs ────────────────────────────────────────────────
-- Lookup por laudo (debug de análises)
CREATE INDEX IF NOT EXISTS idx_ia_logs_laudo
    ON ia_logs (laudo_id, created_at DESC)
    WHERE laudo_id IS NOT NULL;

-- Filtro por erros (monitoramento)
CREATE INDEX IF NOT EXISTS idx_ia_logs_errors
    ON ia_logs (created_at DESC)
    WHERE error_message IS NOT NULL;

-- ─── configuracoes ──────────────────────────────────────────
-- A UNIQUE constraint em user_id já cria um índice implícito
