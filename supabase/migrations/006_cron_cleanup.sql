-- ============================================================
-- 006_cron_cleanup.sql — Agendamento de limpeza do analysis_cache
-- Criado em: 2026-04-11
-- Descrição: Configura pg_cron para chamar cleanup_expired_analysis_cache()
--            diariamente às 03:00 UTC
--
-- PRÉ-REQUISITO: Habilitar pg_cron no Dashboard do Supabase:
--   Database > Extensions > pg_cron > Enable
--   (ou via SQL: CREATE EXTENSION IF NOT EXISTS pg_cron;)
--
-- APLICAR ESTA MIGRATION APÓS HABILITAR pg_cron
-- ============================================================

-- Agendar limpeza diária às 03:00 UTC (meia-noite BRT no horário de verão)
-- Usa ON CONFLICT para ser idempotente (re-executável sem duplicar)
SELECT cron.schedule(
    'cleanup-analysis-cache',            -- nome único do job
    '0 3 * * *',                          -- cron: todos os dias às 03h UTC
    $$
        SELECT cleanup_expired_analysis_cache();
    $$
);

-- Para verificar:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-analysis-cache';

-- Para remover (rollback):
-- SELECT cron.unschedule('cleanup-analysis-cache');
