-- 009_onboarding_completed.sql
-- Adiciona flag para rastrear se o usuario ja completou o tour guiado
-- (react-joyride) do Dashboard. Usado pelo hook useOnboarding no front.

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.onboarding_completed IS
'Flag que indica se o usuario completou o tour guiado de onboarding (react-joyride). Controlado no front via useOnboarding hook.';
