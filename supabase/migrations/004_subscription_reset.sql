-- ============================================================
-- 004_subscription_reset.sql — Reset automático de laudos_used
-- Criado em: 2026-04-08
-- Descrição: Função + trigger para resetar contador mensal de laudos
-- ============================================================

-- Adicionar campo para rastrear quando o período atual começou
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT now();

-- Função que reseta laudos_used quando o período expirou
CREATE OR REPLACE FUNCTION reset_laudos_if_period_expired()
RETURNS TRIGGER AS $$
BEGIN
    -- Se current_period_end existe e já passou, resetar o contador
    IF OLD.current_period_end IS NOT NULL
       AND OLD.current_period_end < now()
       AND NEW.laudos_used > 0
    THEN
        NEW.laudos_used := 0;
        NEW.current_period_start := now();
        NEW.current_period_end := now() + INTERVAL '1 month';
        RAISE NOTICE 'Reset laudos_used para user_id=%', NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: verifica a cada UPDATE se precisa resetar
CREATE TRIGGER trg_reset_laudos_period
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION reset_laudos_if_period_expired();

-- Função chamável via cron ou manualmente para resetar todos os expirados
CREATE OR REPLACE FUNCTION reset_all_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE subscriptions
    SET laudos_used = 0,
        current_period_start = now(),
        current_period_end = now() + INTERVAL '1 month',
        updated_at = now()
    WHERE current_period_end < now()
      AND laudos_used > 0
      AND status = 'active';

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Para rodar via pg_cron (se habilitado no Supabase):
-- SELECT cron.schedule('reset-laudos-monthly', '0 0 1 * *', 'SELECT reset_all_expired_subscriptions()');

COMMENT ON FUNCTION reset_laudos_if_period_expired() IS 'Trigger: reseta laudos_used quando período expira (verificado em cada UPDATE)';
COMMENT ON FUNCTION reset_all_expired_subscriptions() IS 'Batch: reseta todos os subscriptions expirados (para cron mensal)';
