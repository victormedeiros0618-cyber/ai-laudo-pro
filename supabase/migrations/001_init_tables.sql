-- ============================================================
-- 001_init_tables.sql — Schema inicial do VistorIA
-- Criado em: 2026-04-08
-- Descrição: Tabelas principais da aplicação
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── user_profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT,
    terms_version   TEXT NOT NULL DEFAULT 'v1.0',
    lgpd_consent_at TIMESTAMPTZ,
    deletion_requested_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_profiles IS 'Perfil estendido do usuário (LGPD, consentimento, exclusão)';

-- ─── subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    plan_id                 TEXT NOT NULL DEFAULT 'free'
                            CHECK (plan_id IN ('free', 'pro', 'enterprise')),
    status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    laudos_used             INTEGER NOT NULL DEFAULT 0,
    laudos_limit            INTEGER NOT NULL DEFAULT 2,
    current_period_end      TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE subscriptions IS 'Planos e cotas de laudos (Stripe integration)';

-- ─── laudos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS laudos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo          TEXT,
    cliente         TEXT NOT NULL,
    endereco        TEXT,
    tipo_vistoria   TEXT NOT NULL
                    CHECK (tipo_vistoria IN (
                        'Vistoria Técnica',
                        'Inspeção Predial',
                        'Perícia Judicial',
                        'Laudo Cautelar',
                        'Laudo de Reforma',
                        'Laudo de Avaliação'
                    )),
    responsavel     TEXT,
    data_vistoria   DATE NOT NULL,
    gravidade       TEXT,
    conteudo_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    pdf_url         TEXT,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'finalizado', 'assinado')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE laudos IS 'Laudos técnicos gerados pelo sistema';

-- ─── configuracoes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cor_primaria        TEXT NOT NULL DEFAULT '#D4AF37',
    texto_metodologia   TEXT DEFAULT '',
    texto_conclusao     TEXT DEFAULT '',
    vistoriadores       JSONB NOT NULL DEFAULT '[]'::jsonb,
    logo_url            TEXT,
    assinatura_url      TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT configuracoes_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE configuracoes IS 'Configurações visuais e textos padrão do usuário';

-- ─── audit_log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action      TEXT NOT NULL
                CHECK (action IN (
                    'CREATE_LAUDO', 'UPDATE_LAUDO', 'DELETE_LAUDO',
                    'FINALIZE_LAUDO', 'SIGN_LAUDO', 'GENERATE_PDF',
                    'UPDATE_CONFIG', 'UPDATE_PROFILE',
                    'UPGRADE_PLAN', 'CANCEL_PLAN',
                    'LOGIN', 'LOGOUT', 'DELETE_ACCOUNT_REQUEST'
                )),
    resource_id TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_log IS 'Trilha de auditoria de ações do usuário';

-- ─── ia_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ia_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID,
    laudo_id        UUID REFERENCES laudos(id) ON DELETE SET NULL,
    service         TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    error_message   TEXT,
    request_payload JSONB,
    response_raw    JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ia_logs IS 'Logs de chamadas à API do Gemini (debug e billing)';
