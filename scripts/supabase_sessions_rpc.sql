-- Session / device security RPCs
-- Run in Supabase SQL Editor after verifying auth.sessions columns:
--
--   select column_name, data_type
--   from information_schema.columns
--   where table_schema = 'auth' and table_name = 'sessions'
--   order by ordinal_position;
--
-- If `ip` is text (not inet), replace host(s.ip)::text with s.ip::text.
-- If user_agent / ip are missing, drop those columns from the return type and select.

create or replace function public.list_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = auth, public
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.user_agent::text,
    host(s.ip)::text as ip
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.updated_at desc nulls last, s.created_at desc;
$$;

revoke all on function public.list_my_sessions() from public;
grant execute on function public.list_my_sessions() to authenticated;

create or replace function public.revoke_my_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  deleted int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from auth.sessions
  where id = p_session_id
    and user_id = auth.uid();

  get diagnostics deleted = row_count;
  return deleted > 0;
end;
$$;

revoke all on function public.revoke_my_session(uuid) from public;
grant execute on function public.revoke_my_session(uuid) to authenticated;

-- Lightweight check used by the client to detect remote logout while the JWT
-- access token is still within its expiry window.
create or replace function public.is_my_current_session_valid()
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.sessions s
    where s.user_id = auth.uid()
      and s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

revoke all on function public.is_my_current_session_valid() from public;
grant execute on function public.is_my_current_session_valid() to authenticated;
