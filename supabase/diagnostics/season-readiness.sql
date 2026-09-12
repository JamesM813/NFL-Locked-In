-- Read-only checks for the 2026 rollout. Run in the project's SQL Editor.
-- No configuration, schedule, or pick rows are changed.
BEGIN READ ONLY;

SELECT key, value
FROM public.app_config
WHERE key = 'current_season';

SELECT season, count(*) AS games, count(DISTINCT week) AS weeks,
       min(week) AS first_week, max(week) AS last_week,
       min(game_time) AS first_game, max(game_time) AS last_game,
       count(*) FILTER (WHERE locks_at > now()) AS unlocked_games,
       count(*) FILTER (WHERE locks_at IS NULL) AS missing_lock_times
FROM public.nfl_schedule
GROUP BY season
ORDER BY season;

SELECT season, week, count(*) AS games
FROM public.nfl_schedule
WHERE season = 2026
GROUP BY season, week
ORDER BY week;

-- A group selector contains its pick seasons plus app_config.current_season.
SELECT group_id, season, count(*) AS picks,
       count(DISTINCT user_id) AS players_with_picks,
       count(*) FILTER (WHERE status = 'pending') AS pending_picks
FROM public.user_picks
GROUP BY group_id, season
ORDER BY group_id, season;

-- Detect inconsistencies before treating archived picks as reliable.
SELECT p.season, count(*) AS mismatched_picks
FROM public.user_picks p
LEFT JOIN public.nfl_schedule s ON s.api_game_id = p.game_id
WHERE s.api_game_id IS NULL
   OR p.season IS DISTINCT FROM s.season
   OR p.week IS DISTINCT FROM s.week
   OR (p.team_id IS DISTINCT FROM s.home_team_id
       AND p.team_id IS DISTINCT FROM s.away_team_id)
GROUP BY p.season;

ROLLBACK;
