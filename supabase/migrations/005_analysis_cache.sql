-- ============================================================
-- 005_analysis_cache.sql — Cache de análises IA
-- Criado em: 2026-04-08
-- Descrição: Armazena resultados de análise por hash de imagem
--            para evitar chamadas duplicadas ao Gemini (custo $$$)
-- ============================================================

CREATE TABLE IF NOT EXISTS analysis_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_hash      TEXT NOT NULL,
    tipo_laudo      TEXT NOT NULL,
    resultado       JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),

    CONSTRAINT analysis_cache_unique UNIQUE (image_hash, tipo_laudo)
);

COMMENT ON TABLE analysis_cache IS 'Cache de análises Gemini por hash de imagem — evita custo duplicado';

-- Index para lookup rápido
CREATE INDEX IF NOT EXISTS idx_analysis_cache_lookup
    ON analysis_cache (image_hash, tipo_laudo);

-- Index para cleanup de expirados
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires
    ON analysis_cache (expires_at)
    WHERE expires_at < now();

-- Função para limpar cache expirado (rodar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_analysis_cache()
RETURNS INTEGER AS $$
DECLARE
    affected INTEGER;
BEGIN
    DELETE FROM analysis_cache WHERE expires_at < now();
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: cache é público para leitura (compartilhado entre usuários)
-- mas apenas Edge Functions (SERVICE_ROLE) podem inserir
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_cache_select_all"
    ON analysis_cache FOR SELECT
    USING (true);

-- INSERT apenas via SERVICE_ROLE (Edge Functions)
