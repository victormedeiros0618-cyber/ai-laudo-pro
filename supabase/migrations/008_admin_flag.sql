-- 008_admin_flag.sql
-- Adiciona flag administrativa em user_profiles.
-- Usuarios com is_admin=true pulam a verificacao de quota na Edge Function gemini-analyze.
-- Motivacao: evita reset manual de laudos_used via SQL em contas de teste/staff.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Indice parcial: apenas linhas admin sao indexadas (baixa cardinalidade).
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin
ON public.user_profiles(is_admin)
WHERE is_admin = TRUE;

COMMENT ON COLUMN public.user_profiles.is_admin IS
'Flag administrativa. Usuarios com is_admin=true pulam a verificacao de quota (laudos_used >= laudos_limit) na Edge Function gemini-analyze.';
