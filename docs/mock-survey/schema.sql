-- =============================================================================
-- Kirby Gate Live Mock Survey: database for kirbygateliving.com/mock-survey/
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: every statement is idempotent.
--
-- What it creates
--   staff        who can sign in, their role and departments
--   checks       one row per department per day (the daily checklist)
--   actions      corrective-action log (every NC lands here)
--   audits       scheduled audits (every shift / weekly / monthly / quarterly)
--   change_log   who changed what, when (append only, for surveyors)
--   report_log   one row per day the 3:00 PM results email went out
--
-- Who can do what (enforced here in the database, not just in the app)
--   admin     reads everything, writes every department
--   director  reads everything, writes only their own department(s)
--   viewer    reads everything, writes nothing
--   Nobody can read anything without signing in. The website never holds a
--   password: Supabase checks it.
--
-- Staff accounts are made and managed from the SQL Editor (no email needed):
--   select add_staff('dion', 'Dion', 'director', array['maint'], 'TempPass-1234');
--   select reset_staff_password('dion', 'NewTemp-5678');   -- forces a change at next sign-in
--   select set_staff_access('dion', 'director', array['maint']);
--   select set_staff_active('dion', false);                -- blocks sign-in at once
-- Department ids: nursing (incl. memory care), activities, dietary, maint (incl. housekeeping), admin (incl. staffing/HR and rights/admissions)
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables ----
create table if not exists public.staff (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9._-]{2,40}$'),
  full_name   text not null,
  role        text not null check (role in ('admin','director','viewer')),
  depts       text[] not null default '{}',
  active      boolean not null default true,
  must_change_password boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.checks (
  id text primary key, dept text not null, day date not null,
  data jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by uuid);
create table if not exists public.actions (
  id text primary key, dept text not null, day date not null,
  data jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by uuid);
create table if not exists public.audits (
  id text primary key, dept text not null, day date not null,
  data jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by uuid);
create index if not exists checks_day_idx  on public.checks (day);
create index if not exists actions_day_idx on public.actions (day);
create index if not exists audits_day_idx  on public.audits (day);

create table if not exists public.change_log (
  id bigserial primary key, at timestamptz not null default now(),
  user_id uuid, table_name text not null, doc_id text not null, patch jsonb not null);
create index if not exists change_log_doc_idx on public.change_log (table_name, doc_id);

create table if not exists public.report_log (
  day date primary key, sent_at timestamptz not null default now());

-- ---------------------------------------------------------------- helpers ---
create or replace function public.current_staff()
returns public.staff language sql stable security definer set search_path = public as $$
  select * from public.staff where user_id = auth.uid() and active
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active)
$$;

-- Deep merge: objects merge key by key; a JSON null in the patch removes the key.
create or replace function public.jsonb_merge_patch(target jsonb, patch jsonb)
returns jsonb language plpgsql immutable as $$
declare k text; v jsonb; result jsonb := coalesce(target, '{}'::jsonb);
begin
  if jsonb_typeof(patch) <> 'object' then return patch; end if;
  if jsonb_typeof(result) <> 'object' then result := '{}'::jsonb; end if;
  for k, v in select * from jsonb_each(patch) loop
    if jsonb_typeof(v) = 'null' then
      result := result - k;
    elsif jsonb_typeof(v) = 'object' and jsonb_typeof(result -> k) = 'object' then
      result := jsonb_set(result, array[k], public.jsonb_merge_patch(result -> k, v));
    else
      result := jsonb_set(result, array[k], public.jsonb_merge_patch(null, v));
    end if;
  end loop;
  return result;
end $$;

create or replace function public.central_today()
returns date language sql stable as $$ select (now() at time zone 'America/Chicago')::date $$;

-- ------------------------------------------------------------ the one write --
-- Every change from the app goes through this function. It checks who is
-- signing, which department the record belongs to, stamps the time on the
-- server (so "submitted at" cannot be faked), merges the change and logs it.
create or replace function public.save_doc(p_table text, p_id text, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  me public.staff; cur jsonb; v_dept text; v_day date; merged jsonb; exists_row boolean;
  stamp text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  select * into me from public.staff where user_id = auth.uid() and active;
  if me.user_id is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  if me.role = 'viewer' then raise exception 'View-only account' using errcode = '42501'; end if;
  if p_table not in ('checks','actions','audits') then raise exception 'Unknown table' using errcode = '22023'; end if;
  if p_id !~ '^[A-Za-z0-9_.:-]{1,100}$' then raise exception 'Bad id' using errcode = '22023'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or length(p_patch::text) > 60000 then
    raise exception 'Bad change' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtext(p_table || '/' || p_id));
  execute format('select data, dept from public.%I where id = $1', p_table) into cur, v_dept using p_id;
  exists_row := v_dept is not null;

  -- department and day are fixed once a record exists
  if exists_row then
    p_patch := p_patch - 'dept';
    if p_table = 'checks' then p_patch := p_patch - 'date'; end if;
  else
    v_dept := p_patch ->> 'dept';
  end if;
  if v_dept is null or v_dept not in ('nursing','activities','dietary','maint','admin') then
    raise exception 'Unknown department' using errcode = '22023'; end if;
  if me.role = 'director' and not (v_dept = any(me.depts)) then
    raise exception 'Your account cannot change this department' using errcode = '42501'; end if;

  -- server-side stamps (client values are ignored)
  p_patch := p_patch - 'updatedAt' - 'updatedBy' - 'submittedAt' - 'submittedBy' - 'createdAt' - 'createdBy' - 'doneAt' - 'closedAt';
  p_patch := p_patch || jsonb_build_object('updatedAt', stamp, 'updatedBy', me.user_id);

  if p_table = 'checks' then
    if exists_row and coalesce((cur ->> 'submitted')::boolean, false) and not (p_patch ? 'submitted') then
      raise exception 'This checklist is already submitted. Reopen it to make changes.' using errcode = '55000'; end if;
    if (p_patch ->> 'submitted') = 'true' then
      p_patch := p_patch || jsonb_build_object('submittedAt', stamp, 'submittedBy', me.user_id);
    elsif (p_patch ->> 'submitted') = 'false' then
      p_patch := p_patch || jsonb_build_object('reopenedAt', stamp);
    end if;
  elsif p_table = 'actions' then
    if not exists_row then p_patch := p_patch || jsonb_build_object('createdAt', stamp, 'createdBy', me.user_id); end if;
    if (p_patch ->> 'status') = 'Closed' and coalesce(cur ->> 'status', '') <> 'Closed' then
      p_patch := p_patch || jsonb_build_object('closedAt', stamp); end if;
  elsif p_table = 'audits' then
    if exists_row then raise exception 'This audit is already logged' using errcode = '55000'; end if;
    p_patch := p_patch || jsonb_build_object('doneAt', stamp, 'userId', me.user_id,
      'doneDate', to_char(public.central_today(), 'YYYY-MM-DD'));
  end if;

  merged := public.jsonb_merge_patch(cur, p_patch);
  v_day := case p_table when 'checks' then (merged ->> 'date')::date
                        when 'actions' then (merged ->> 'date')::date
                        else (merged ->> 'doneDate')::date end;
  if v_day is null then raise exception 'Missing date' using errcode = '22023'; end if;

  -- directors may only fill in today's or yesterday's checklist
  if p_table = 'checks' and me.role = 'director'
     and (v_day > public.central_today() or v_day < public.central_today() - 1) then
    raise exception 'Directors can only fill in today''s or yesterday''s checklist' using errcode = '42501'; end if;

  execute format(
    'insert into public.%I (id, dept, day, data, updated_at, updated_by) values ($1,$2,$3,$4,now(),$5)
     on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = excluded.updated_by',
    p_table) using p_id, v_dept, v_day, merged, me.user_id;
  insert into public.change_log (user_id, table_name, doc_id, patch) values (me.user_id, p_table, p_id, p_patch);
  return merged;
end $$;

create or replace function public.my_profile()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('id', user_id, 'username', username, 'name', full_name, 'role', role,
    'depts', depts, 'mustChangePassword', must_change_password)
  from public.staff where user_id = auth.uid() and active
$$;

create or replace function public.password_changed()
returns void language sql security definer set search_path = public as $$
  update public.staff set must_change_password = false where user_id = auth.uid()
$$;

-- ------------------------------------------------- account administration ---
-- Run these from the SQL Editor only. The app cannot call them.
create or replace function public.add_staff(p_username text, p_full_name text, p_role text, p_depts text[], p_password text)
returns text language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid := gen_random_uuid(); em text; uname text := lower(trim(p_username));
begin
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  em := uname || '@staff.kirbygateliving.com';
  if exists (select 1 from auth.users where email = em) then raise exception 'Username % already exists', uname; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    crypt(p_password, gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name), now(), now(),
    '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  insert into public.staff (user_id, username, full_name, role, depts)
  values (uid, uname, p_full_name, p_role, coalesce(p_depts, '{}'));
  return 'Created ' || uname || ' (' || p_role || ')';
end $$;

create or replace function public.reset_staff_password(p_username text, p_password text)
returns text language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid;
begin
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  select user_id into uid from public.staff where username = lower(trim(p_username));
  if uid is null then raise exception 'No such username'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf', 10)), updated_at = now() where id = uid;
  update public.staff set must_change_password = true where user_id = uid;
  return 'Password reset for ' || lower(trim(p_username));
end $$;

create or replace function public.set_staff_access(p_username text, p_role text, p_depts text[])
returns text language sql security definer set search_path = public as $$
  update public.staff set role = p_role, depts = coalesce(p_depts, '{}') where username = lower(trim(p_username))
  returning 'Updated ' || username
$$;

create or replace function public.set_staff_active(p_username text, p_active boolean)
returns text language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  update public.staff set active = p_active where username = lower(trim(p_username)) returning user_id into uid;
  if uid is null then raise exception 'No such username'; end if;
  -- sign them out everywhere when deactivating
  if not p_active then delete from auth.refresh_tokens where user_id::text = uid::text; end if;
  return case when p_active then 'Activated ' else 'Deactivated ' end || lower(trim(p_username));
end $$;

-- ---------------------------------------------------------------- access ----
alter table public.staff      enable row level security;
alter table public.checks     enable row level security;
alter table public.actions    enable row level security;
alter table public.audits     enable row level security;
alter table public.change_log enable row level security;
alter table public.report_log enable row level security;

revoke all on public.staff, public.checks, public.actions, public.audits, public.change_log, public.report_log from anon, authenticated;
grant select on public.staff, public.checks, public.actions, public.audits to authenticated;
grant select on public.change_log to authenticated;

drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated using (public.is_staff());
drop policy if exists checks_read on public.checks;
create policy checks_read on public.checks for select to authenticated using (public.is_staff());
drop policy if exists actions_read on public.actions;
create policy actions_read on public.actions for select to authenticated using (public.is_staff());
drop policy if exists audits_read on public.audits;
create policy audits_read on public.audits for select to authenticated using (public.is_staff());
drop policy if exists change_log_read on public.change_log;
create policy change_log_read on public.change_log for select to authenticated
  using (exists (select 1 from public.staff where user_id = auth.uid() and active and role = 'admin'));

revoke all on function public.current_staff(), public.is_staff(), public.save_doc(text,text,jsonb),
  public.my_profile(), public.password_changed(), public.jsonb_merge_patch(jsonb,jsonb), public.central_today(),
  public.add_staff(text,text,text,text[],text), public.reset_staff_password(text,text),
  public.set_staff_access(text,text,text[]), public.set_staff_active(text,boolean)
  from public, anon, authenticated;
grant execute on function public.is_staff(), public.save_doc(text,text,jsonb), public.my_profile(),
  public.password_changed() to authenticated;

-- live updates on phones
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.checks; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.actions; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.audits; exception when duplicate_object then null; end;
  end if;
end $$;

-- =============================================================================
-- Hardening (applied to the live project 2026-11-25 as migration "security_hardening")
-- Until someone replaces their starting password they can sign in, but cannot
-- read or change any survey data, and cannot skip the change by calling
-- password_changed() directly.
-- =============================================================================
alter function public.jsonb_merge_patch(jsonb, jsonb) set search_path = public;
alter function public.central_today() set search_path = public;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.staff_temp_pw (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pw_hash text not null,
  set_at  timestamptz not null default now());
revoke all on private.staff_temp_pw from public, anon, authenticated;

insert into private.staff_temp_pw (user_id, pw_hash)
select s.user_id, u.encrypted_password from public.staff s join auth.users u on u.id = s.user_id
where s.must_change_password
on conflict (user_id) do update set pw_hash = excluded.pw_hash, set_at = now();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active and not must_change_password)
$$;

create or replace function public.current_staff()
returns public.staff language sql stable security definer set search_path = public as $$
  select * from public.staff where user_id = auth.uid() and active and not must_change_password
$$;

drop policy if exists change_log_read on public.change_log;
create policy change_log_read on public.change_log for select to authenticated
  using (exists (select 1 from public.staff where user_id = auth.uid() and active
                 and not must_change_password and role = 'admin'));

create or replace function public.password_changed()
returns void language plpgsql security definer set search_path = public, private, auth as $$
begin
  if exists (select 1 from private.staff_temp_pw t join auth.users u on u.id = t.user_id
             where t.user_id = auth.uid() and u.encrypted_password = t.pw_hash) then
    raise exception 'Change your password first' using errcode = '42501';
  end if;
  update public.staff set must_change_password = false where user_id = auth.uid();
  delete from private.staff_temp_pw where user_id = auth.uid();
end $$;

-- save_doc: same as above plus a "change your password first" check
create or replace function public.save_doc(p_table text, p_id text, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  me public.staff; cur jsonb; v_dept text; v_day date; merged jsonb; exists_row boolean;
  stamp text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  select * into me from public.staff where user_id = auth.uid() and active;
  if me.user_id is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  if me.must_change_password then raise exception 'Change your password first' using errcode = '42501'; end if;
  if me.role = 'viewer' then raise exception 'View-only account' using errcode = '42501'; end if;
  if p_table not in ('checks','actions','audits') then raise exception 'Unknown table' using errcode = '22023'; end if;
  if p_id !~ '^[A-Za-z0-9_.:-]{1,100}$' then raise exception 'Bad id' using errcode = '22023'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or length(p_patch::text) > 60000 then
    raise exception 'Bad change' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtext(p_table || '/' || p_id));
  execute format('select data, dept from public.%I where id = $1', p_table) into cur, v_dept using p_id;
  exists_row := v_dept is not null;

  if exists_row then
    p_patch := p_patch - 'dept';
    if p_table = 'checks' then p_patch := p_patch - 'date'; end if;
  else
    v_dept := p_patch ->> 'dept';
  end if;
  if v_dept is null or v_dept not in ('nursing','activities','dietary','maint','admin') then
    raise exception 'Unknown department' using errcode = '22023'; end if;
  if me.role = 'director' and not (v_dept = any(me.depts)) then
    raise exception 'Your account cannot change this department' using errcode = '42501'; end if;

  p_patch := p_patch - 'updatedAt' - 'updatedBy' - 'submittedAt' - 'submittedBy' - 'createdAt' - 'createdBy' - 'doneAt' - 'closedAt';
  p_patch := p_patch || jsonb_build_object('updatedAt', stamp, 'updatedBy', me.user_id);

  if p_table = 'checks' then
    if exists_row and coalesce((cur ->> 'submitted')::boolean, false) and not (p_patch ? 'submitted') then
      raise exception 'This checklist is already submitted. Reopen it to make changes.' using errcode = '55000'; end if;
    if (p_patch ->> 'submitted') = 'true' then
      p_patch := p_patch || jsonb_build_object('submittedAt', stamp, 'submittedBy', me.user_id);
    elsif (p_patch ->> 'submitted') = 'false' then
      p_patch := p_patch || jsonb_build_object('reopenedAt', stamp);
    end if;
  elsif p_table = 'actions' then
    if not exists_row then p_patch := p_patch || jsonb_build_object('createdAt', stamp, 'createdBy', me.user_id); end if;
    if (p_patch ->> 'status') = 'Closed' and coalesce(cur ->> 'status', '') <> 'Closed' then
      p_patch := p_patch || jsonb_build_object('closedAt', stamp); end if;
  elsif p_table = 'audits' then
    if exists_row then raise exception 'This audit is already logged' using errcode = '55000'; end if;
    p_patch := p_patch || jsonb_build_object('doneAt', stamp, 'userId', me.user_id,
      'doneDate', to_char(public.central_today(), 'YYYY-MM-DD'));
  end if;

  merged := public.jsonb_merge_patch(cur, p_patch);
  v_day := case p_table when 'checks' then (merged ->> 'date')::date
                        when 'actions' then (merged ->> 'date')::date
                        else (merged ->> 'doneDate')::date end;
  if v_day is null then raise exception 'Missing date' using errcode = '22023'; end if;

  if p_table = 'checks' and me.role = 'director'
     and (v_day > public.central_today() or v_day < public.central_today() - 1) then
    raise exception 'Directors can only fill in today''s or yesterday''s checklist' using errcode = '42501'; end if;

  execute format(
    'insert into public.%I (id, dept, day, data, updated_at, updated_by) values ($1,$2,$3,$4,now(),$5)
     on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = excluded.updated_by',
    p_table) using p_id, v_dept, v_day, merged, me.user_id;
  insert into public.change_log (user_id, table_name, doc_id, patch) values (me.user_id, p_table, p_id, p_patch);
  return merged;
end $$;

-- add_staff / reset_staff_password also remember the starting password's hash
create or replace function public.add_staff(p_username text, p_full_name text, p_role text, p_depts text[], p_password text)
returns text language plpgsql security definer set search_path = public, extensions, auth, private as $$
declare uid uuid := gen_random_uuid(); em text; uname text := lower(trim(p_username)); h text;
begin
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  em := uname || '@staff.kirbygateliving.com';
  if exists (select 1 from auth.users where email = em) then raise exception 'Username % already exists', uname; end if;
  h := crypt(p_password, gen_salt('bf', 10));
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    h, now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name), now(), now(),
    '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  insert into public.staff (user_id, username, full_name, role, depts)
  values (uid, uname, p_full_name, p_role, coalesce(p_depts, '{}'));
  insert into private.staff_temp_pw (user_id, pw_hash) values (uid, h);
  return 'Created ' || uname || ' (' || p_role || ')';
end $$;

create or replace function public.reset_staff_password(p_username text, p_password text)
returns text language plpgsql security definer set search_path = public, extensions, auth, private as $$
declare uid uuid; h text;
begin
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  select user_id into uid from public.staff where username = lower(trim(p_username));
  if uid is null then raise exception 'No such username'; end if;
  h := crypt(p_password, gen_salt('bf', 10));
  update auth.users set encrypted_password = h, updated_at = now() where id = uid;
  update public.staff set must_change_password = true where user_id = uid;
  insert into private.staff_temp_pw (user_id, pw_hash) values (uid, h)
    on conflict (user_id) do update set pw_hash = excluded.pw_hash, set_at = now();
  delete from auth.refresh_tokens where user_id::text = uid::text;
  return 'Password reset for ' || lower(trim(p_username));
end $$;

revoke all on function public.current_staff(), public.is_staff(), public.save_doc(text,text,jsonb),
  public.my_profile(), public.password_changed(), public.jsonb_merge_patch(jsonb,jsonb), public.central_today(),
  public.add_staff(text,text,text,text[],text), public.reset_staff_password(text,text),
  public.set_staff_access(text,text,text[]), public.set_staff_active(text,boolean)
  from public, anon, authenticated;
grant execute on function public.is_staff(), public.save_doc(text,text,jsonb), public.my_profile(),
  public.password_changed() to authenticated;

revoke all on sequence public.change_log_id_seq from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- =============================================================================
-- Team progress for leadership (added 2026-11-25): who has signed in, when they
-- were last seen. Only active admins who have set their own password get rows.
-- =============================================================================
create or replace function public.team_status()
returns table(user_id uuid, full_name text, username text, role text, depts text[], active boolean, set_password boolean, last_sign_in timestamptz)
language sql stable security definer set search_path = public, auth as $$
  select s.user_id, s.full_name, s.username, s.role, s.depts, s.active, not s.must_change_password, u.last_sign_in_at
  from public.staff s join auth.users u on u.id = s.user_id
  where exists (select 1 from public.staff me where me.user_id = auth.uid() and me.active
                and not me.must_change_password and me.role = 'admin')
  order by case s.role when 'director' then 0 when 'admin' then 1 else 2 end, s.full_name
$$;
revoke all on function public.team_status() from public, anon, authenticated;
grant execute on function public.team_status() to authenticated;
-- ------------------------------------------------- department visibility ---
-- Department heads (role 'director') read only their own department(s).
-- Leadership (role 'admin') and view-only accounts ('viewer') read everything.
-- (Applied to the live project as migration "department_visibility".)
create or replace function public.can_view_dept(p_dept text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff
    where user_id = auth.uid() and active and not must_change_password
      and (role in ('admin','viewer') or p_dept = any(depts)))
$$;
create or replace function public.is_leader()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff
    where user_id = auth.uid() and active and not must_change_password and role in ('admin','viewer'))
$$;
revoke all on function public.can_view_dept(text), public.is_leader() from public, anon;
grant execute on function public.can_view_dept(text), public.is_leader() to authenticated;
drop policy if exists checks_read on public.checks;
create policy checks_read on public.checks for select to authenticated using (public.can_view_dept(dept));
drop policy if exists actions_read on public.actions;
create policy actions_read on public.actions for select to authenticated using (public.can_view_dept(dept));
drop policy if exists audits_read on public.audits;
create policy audits_read on public.audits for select to authenticated using (public.can_view_dept(dept));
drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated
  using (public.is_leader() or (user_id = auth.uid() and public.is_staff()));
