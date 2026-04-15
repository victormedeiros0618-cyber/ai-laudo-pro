-- ============================================================
-- 002_rls_policies.sql — Row Level Security
-- Criado em: 2026-04-08
-- Descrição: Políticas RLS para isolamento de dados por usuário
-- ============================================================

-- ─── Ativar RLS em todas as tabelas ─────────────────────────
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_logs         ENABLE ROW LEVEL SECURITY;

-- ─── user_profiles ──────────────────────────────────────────
CREATE POLICY "user_profiles_select_own"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Usuários não podem deletar seu próprio perfil (soft delete via deletion_requested_at)
-- A exclusão real é feita por um job administrativo após 30 dias

-- ─── subscriptions ──────────────────────────────────────────
CREATE POLICY "subscriptions_select_own"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Não permitir delete direto — cancelamento via status

-- ─── laudos ─────────────────────────────────────────────────
CREATE POLICY "laudos_select_own"
    ON laudos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "laudos_insert_own"
    ON laudos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "laudos_update_own"
    ON laudos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "laudos_delete_own"
    ON laudos FOR DELETE
    USING (auth.uid() = user_id);

-- ─── configuracoes ──────────────────────────────────────────
CREATE POLICY "configuracoes_select_own"
    ON configuracoes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "configuracoes_insert_own"
    ON configuracoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "configuracoes_update_own"
    ON configuracoes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ─── audit_log ──────────────────────────────────────────────
CREATE POLICY "audit_log_select_own"
    ON audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "audit_log_insert_own"
    ON audit_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Audit logs não podem ser atualizados nem deletados pelo usuário (imutáveis)

-- ─── ia_logs ────────────────────────────────────────────────
-- ia_logs são inseridos pelas Edge Functions com SERVICE_ROLE_KEY (bypass RLS)
-- Usuários podem visualizar apenas seus próprios logs
CREATE POLICY "ia_logs_select_own"
    ON ia_logs FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT é feito via SERVICE_ROLE (sem policy para INSERT do usuário)
-- Isso impede que um usuário forje logs de IA
