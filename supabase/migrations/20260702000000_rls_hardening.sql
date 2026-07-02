-- RLS hardening: close cheating / data-leak holes and tidy advisor warnings.
-- Applied to project ekhovxsprzefjojnwtvl (Locked-In) on 2026-07-02.
--
-- Context: RLS was enabled on every table, but most write policies were
-- USING (true) / WITH CHECK (true), which is equivalent to no protection.
-- Scoring is performed by the NFL-Scraper edge function using the service_role
-- key (which bypasses RLS), so regular users must never write score/status.

-- =========================================================
-- user_picks: own rows only, must be a group member, cannot set score/status,
-- and the referenced game must not be locked yet (checked against nfl_schedule,
-- not the client-supplied locks_at value).
-- =========================================================
drop policy if exists "Enable read access for all users" on public.user_picks;
drop policy if exists "Enable insert for authenticated users only" on public.user_picks;
drop policy if exists "Users can update picks" on public.user_picks;
drop policy if exists "Enable delete for users based on user_id" on public.user_picks;

create policy "Members can view picks in their groups" on public.user_picks
for select to authenticated
using ( group_id in (select public.user_group_ids((select auth.uid()))) );

create policy "Users insert own unlocked picks" on public.user_picks
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and group_id in (select public.user_group_ids((select auth.uid())))
  and status = 'pending'
  and score = 0
  and exists (select 1 from public.nfl_schedule s
              where s.api_game_id = user_picks.game_id and s.locks_at > now())
);

create policy "Users update own unlocked picks" on public.user_picks
for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.nfl_schedule s
              where s.api_game_id = user_picks.game_id and s.locks_at > now())
)
with check (
  user_id = (select auth.uid())
  and group_id in (select public.user_group_ids((select auth.uid())))
  and status = 'pending'
  and score = 0
  and exists (select 1 from public.nfl_schedule s
              where s.api_game_id = user_picks.game_id and s.locks_at > now())
);

create policy "Users delete own unlocked picks" on public.user_picks
for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.nfl_schedule s
              where s.api_game_id = user_picks.game_id and s.locks_at > now())
);

-- =========================================================
-- profile_groups: no self-promotion to admin; only join public groups directly
-- (private groups are joined via the join_group_by_code RPC below).
-- =========================================================
drop policy if exists "Users can update own group memberships" on public.profile_groups;
drop policy if exists "Users can insert own group memberships" on public.profile_groups;

create policy "Users join public groups or groups they created" on public.profile_groups
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    exists (select 1 from public.groups g where g.id = group_id and g.admin_id = (select auth.uid()))
    or (
      coalesce(is_admin, false) = false
      and exists (select 1 from public.groups g where g.id = group_id and g.is_public)
    )
  )
);

-- =========================================================
-- group_join_codes: only the group admin (or a member if allow_invites) can
-- read/create/delete codes. Removes the public-readable (enumerable) policy.
-- =========================================================
drop policy if exists "Enable read access for all users" on public.group_join_codes;
drop policy if exists "Enable insert for authenticated users only" on public.group_join_codes;
drop policy if exists "Enable delete for authenticated users only" on public.group_join_codes;

create policy "Invite managers can view join codes" on public.group_join_codes
for select to authenticated
using (
  exists (select 1 from public.groups g where g.id = group_id
          and (g.admin_id = (select auth.uid())
               or (g.allow_invites and group_id in (select public.user_group_ids((select auth.uid()))))))
);

create policy "Invite managers can create join codes" on public.group_join_codes
for insert to authenticated
with check (
  exists (select 1 from public.groups g where g.id = group_id
          and (g.admin_id = (select auth.uid())
               or (g.allow_invites and group_id in (select public.user_group_ids((select auth.uid()))))))
);

create policy "Invite managers can delete join codes" on public.group_join_codes
for delete to authenticated
using (
  exists (select 1 from public.groups g where g.id = group_id
          and (g.admin_id = (select auth.uid())
               or (g.allow_invites and group_id in (select public.user_group_ids((select auth.uid()))))))
);

-- =========================================================
-- contact_submissions: remove public read access (was leaking name/email/message).
-- =========================================================
drop policy if exists "Enable read access for all users" on public.contact_submissions;

-- =========================================================
-- groups: creator must own the group; reads limited to public / member / admin.
-- =========================================================
drop policy if exists "Enable insert for authenticated users only" on public.groups;
create policy "Users create groups they admin" on public.groups
for insert to authenticated
with check ( admin_id = (select auth.uid()) );

drop policy if exists "Enable read access for all users" on public.groups;
create policy "View public or member groups" on public.groups
for select to authenticated
using (
  is_public
  or id in (select public.user_group_ids((select auth.uid())))
  or admin_id = (select auth.uid())
);

-- =========================================================
-- join_group_by_code: server-side validation so join codes stay non-enumerable.
-- =========================================================
create or replace function public.join_group_by_code(p_code text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id bigint;
  v_expires  timestamptz;
  v_size     int;
  v_uid      uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select c.group_id, c.expires_at into v_group_id, v_expires
  from public.group_join_codes c
  where c.join_code = p_code
  order by c.created_at desc
  limit 1;

  if v_group_id is null then
    raise exception 'Invalid join code';
  end if;
  if v_expires < now() then
    raise exception 'This join code has expired';
  end if;
  if exists (select 1 from public.profile_groups pg
             where pg.group_id = v_group_id and pg.user_id = v_uid) then
    raise exception 'You are already a member of this group';
  end if;

  select count(*) into v_size from public.profile_groups where group_id = v_group_id;
  if v_size >= 10 then
    raise exception 'This group is already full';
  end if;

  insert into public.profile_groups (user_id, group_id, is_admin)
  values (v_uid, v_group_id, false);

  return v_group_id;
end;
$$;

revoke execute on function public.join_group_by_code(text) from public, anon;
grant  execute on function public.join_group_by_code(text) to authenticated;

-- =========================================================
-- nfl_schedule: replace deprecated auth.role() with the TO authenticated clause.
-- =========================================================
drop policy if exists "Allow authenticated read" on public.nfl_schedule;
create policy "Allow authenticated read" on public.nfl_schedule
for select to authenticated
using ( true );

-- =========================================================
-- group_member_counts: recreate the SECURITY DEFINER view as security_invoker,
-- computing size via a definer helper so counts stay accurate for public groups
-- the caller is not a member of (member rows are otherwise hidden by RLS).
-- =========================================================
create or replace function public.group_member_count(gid bigint)
returns integer
language sql
security definer
set search_path = ''
as $$ select count(*)::int from public.profile_groups where group_id = gid; $$;

revoke execute on function public.group_member_count(bigint) from public, anon;
grant  execute on function public.group_member_count(bigint) to authenticated;

drop view if exists public.group_member_counts;
create view public.group_member_counts
with (security_invoker = true) as
select g.id, g.name, g.admin_id, g.created_at, g.group_picture_url,
       g.allow_invites, g.is_public,
       public.group_member_count(g.id) as group_size
from public.groups g;

grant select on public.group_member_counts to authenticated;

-- =========================================================
-- Pin search_path (and revoke RPC access where appropriate) on functions.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare generated_username text;
begin
  generated_username := split_part(NEW.email, '@', 1);
  insert into public.profiles (id, username) values (NEW.id, generated_username);
  return NEW;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.generate_unique_join_code()
returns trigger language plpgsql set search_path = ''
as $$
declare new_code text; code_exists boolean;
begin
  loop
    new_code := lpad(((random()*900000)+100000)::int::text, 6, '0');
    select exists(select 1 from public.group_join_codes where join_code = new_code) into code_exists;
    if not code_exists then NEW.join_code := new_code; exit; end if;
  end loop;
  return NEW;
end;
$$;

create or replace function public.delete_old_join_codes()
returns trigger language plpgsql set search_path = ''
as $$
begin
  delete from public.group_join_codes where group_id = NEW.group_id and id <> NEW.id;
  return NEW;
end;
$$;

create or replace function public.recalculate_all_group_sizes()
returns void language plpgsql set search_path = ''
as $$
begin
  update public.groups
  set group_size = (select count(*) from public.profile_groups
                    where profile_groups.group_id = groups.id);
end;
$$;

-- user_group_ids is only referenced by TO authenticated policies; remove the
-- default PUBLIC execute grant (which anon inherits) and grant only authenticated.
revoke execute on function public.user_group_ids(uuid) from public;
grant  execute on function public.user_group_ids(uuid) to authenticated;
