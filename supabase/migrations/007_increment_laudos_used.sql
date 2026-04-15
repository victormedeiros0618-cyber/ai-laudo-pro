-- Migration 007: função RPC para incremento atômico de laudos_used
--
-- Garante que a contagem de laudos usados é controlada exclusivamente
-- pelo servidor (Edge Function), nunca pelo frontend.
--
-- A função verifica o limite antes de incrementar e retorna:
--   'ok'           — incrementado com sucesso
--   'limit_reached' — usuário já atingiu o limite do plano
--   'not_found'    — subscription não existe para este user_id

create or replace function public.increment_laudos_used(p_user_id uuid)
returns text
language plpgsql
security definer  -- executa com privilégios do owner, não do caller
as $$
declare
  v_used    integer;
  v_limit   integer;
begin
  -- Lê o estado atual com lock de linha para evitar race condition
  select laudos_used, laudos_limit
    into v_used, v_limit
    from public.subscriptions
   where user_id = p_user_id
     for update;

  -- Subscription não existe
  if not found then
    return 'not_found';
  end if;

  -- Limite atingido
  if v_used >= v_limit then
    return 'limit_reached';
  end if;

  -- Incremento atômico
  update public.subscriptions
     set laudos_used = v_used + 1,
         updated_at  = now()
   where user_id = p_user_id;

  return 'ok';
end;
$$;

-- Revogar acesso público e liberar apenas para service_role
-- (a Edge Function usa SUPABASE_SERVICE_ROLE_KEY)
revoke all on function public.increment_laudos_used(uuid) from public;
revoke all on function public.increment_laudos_used(uuid) from anon;
revoke all on function public.increment_laudos_used(uuid) from authenticated;
grant execute on function public.increment_laudos_used(uuid) to service_role;

comment on function public.increment_laudos_used(uuid) is
  'Incrementa laudos_used da subscription do usuário de forma atômica e segura. '
  'Chamada exclusivamente pela Edge Function gemini-analyze. '
  'Retorna: ok | limit_reached | not_found';
