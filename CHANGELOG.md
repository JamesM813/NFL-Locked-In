# Changelog

## [2.0.0] — 2026-09-12 — Multiple seasons

The app now spans multiple NFL seasons. Previous seasons stay intact and
viewable read-only instead of being overwritten each year.

### Added

- **Multi-season data model.** `nfl_schedule` and `user_picks` each carry a
  `season` column. Uniqueness is per-season — one pick per week, and each team
  usable once, are both scoped to `(user_id, group_id, season)` — so a team
  used in 2025 is available again in 2026.
- **Season selector.** Groups holding picks in more than one season can switch
  between them. Past seasons render read-only; every write is gated on the
  season being current.
- **`app_config.current_season`** as the single source of truth for the active
  season, read by the frontend and both edge functions.
- Scheduled scoring: the data-fetch workflow now invokes `nfl-scraper` after a
  successful fetch.

### Fixed

- **The workflow skipped every August and September.** `date +%m` returns a
  zero-padded month, and bash reads a leading zero as octal, so `08` and `09`
  are invalid octal. The season gate errored and fell through to "not in
  season", skipping the fetch entirely while exiting green in ~7 seconds. Since
  the NFL season begins in September, this disabled the pipeline at exactly the
  moment it was needed. Months now parse with `10#`.
- **ESPN rejected every schedule fetch with 403.** Deno's default `User-Agent`
  is blocked; requests now send an explicit one. Verified from Supabase egress —
  local `curl` results do not predict edge-function behaviour.
- **A failed schedule fetch reported success.** `test-fetch` returned HTTP 200
  even when all 19 weeks failed, and the workflow only checks the status code.
  It now returns 502 when every requested week fails.
- **Intermittent config reads silently served the wrong season.** The
  `app_config` read fails periodically with a Gateway Timeout, and all three
  readers fell back to a hard-coded `2025` — meaning the scorer could score a
  finished season, and users could be shown it. All three now retry with
  backoff, then fail loudly: the edge functions return 503 rather than act on a
  guessed season, and the frontend shows an explicit error with a retry
  control.
- `seed.ts` sends the same explicit `User-Agent`; Node's default is rejected
  too. **Unverified** — the script was not needed for the 2026 rollover.

### Known limitations

- GitHub throttles the hourly schedule to roughly 4.5-hour intervals, and does
  the same to the game-day `*/15` schedule. `nfl-scraper` runs on its own
  15-minute scheduler but can only score what `test-fetch` has pulled in, so
  in-game results lag by hours. Moving the fetch off GitHub Actions is the fix.
- Season rollover still has no code path; it is a manual procedure (see
  README → Season rollover).
- The workflow's `week` input never reaches the function, and its week
  calculation resets to 1 each January. These are only harmless as a pair —
  fix both or neither.
