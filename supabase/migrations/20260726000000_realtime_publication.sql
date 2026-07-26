-- Enable Realtime for the group dashboard.
-- postgres_changes subscriptions only receive events for tables in the
-- supabase_realtime publication; RLS still gates which rows each user sees.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_picks'
  ) then
    alter publication supabase_realtime add table public.user_picks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'nfl_schedule'
  ) then
    alter publication supabase_realtime add table public.nfl_schedule;
  end if;
end $$;
