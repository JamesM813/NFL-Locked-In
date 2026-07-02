-- Multi-season support: add a season dimension to games and picks so the app
-- can run across NFL seasons without week/team collisions.
--
-- All existing rows are 2025-season data; ADD COLUMN ... NOT NULL DEFAULT 2025
-- backfills them atomically. The default is then dropped so any writer that
-- forgets to stamp a season fails loudly instead of silently writing 2025.

-- =========================================================
-- nfl_schedule: season column + index
-- =========================================================
ALTER TABLE public.nfl_schedule
  ADD COLUMN season smallint NOT NULL DEFAULT 2025;

ALTER TABLE public.nfl_schedule
  ALTER COLUMN season DROP DEFAULT;

CREATE INDEX idx_nfl_schedule_season ON public.nfl_schedule(season);

-- =========================================================
-- user_picks: season column + season-aware unique constraints.
-- Both "one pick per week" and "each team once" are per-season rules.
-- =========================================================
ALTER TABLE public.user_picks
  ADD COLUMN season smallint NOT NULL DEFAULT 2025;

ALTER TABLE public.user_picks
  ALTER COLUMN season DROP DEFAULT;

ALTER TABLE public.user_picks
  DROP CONSTRAINT unique_user_week_group;

ALTER TABLE public.user_picks
  ADD CONSTRAINT unique_user_week_group
  UNIQUE (user_id, group_id, season, week);

ALTER TABLE public.user_picks
  DROP CONSTRAINT unique_user_team_group;

ALTER TABLE public.user_picks
  ADD CONSTRAINT unique_user_team_group
  UNIQUE (user_id, group_id, season, team_id);

-- =========================================================
-- app_config: single source of truth for the current season.
-- The NFL-Scraper/rollover updates it (service_role); clients only read.
-- =========================================================
CREATE TABLE public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read" ON public.app_config
FOR SELECT TO authenticated
USING ( true );

INSERT INTO public.app_config (key, value) VALUES ('current_season', '2025');

-- =========================================================
-- user_picks write policies: require the pick's season to match the
-- referenced game's season, so a client cannot stamp a pick into a
-- different season than the game it references.
-- =========================================================
drop policy if exists "Users insert own unlocked picks" on public.user_picks;
create policy "Users insert own unlocked picks" on public.user_picks
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and group_id in (select public.user_group_ids((select auth.uid())))
  and status = 'pending'
  and score = 0
  and exists (select 1 from public.nfl_schedule s
              where s.api_game_id = user_picks.game_id
                and s.season = user_picks.season
                and s.locks_at > now())
);

drop policy if exists "Users update own unlocked picks" on public.user_picks;
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
              where s.api_game_id = user_picks.game_id
                and s.season = user_picks.season
                and s.locks_at > now())
);
