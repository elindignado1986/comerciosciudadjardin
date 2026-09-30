-- Supabase may grant EXECUTE directly to API roles through default privileges.
-- Revoking PUBLIC alone does not revoke these explicit grants.
revoke all on function public.approve_submission(uuid) from public, anon;
grant execute on function public.approve_submission(uuid) to authenticated;

revoke all on function public.consume_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
