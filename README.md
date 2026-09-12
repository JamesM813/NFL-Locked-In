# 🏈 NFL Locked In

NFL Locked In is a web application that combines the fun of NFL pick’em with a scoring system that rewards smart, unique choices. It’s designed for groups of friends who want more strategy than just “pick the obvious winner.”  

Built with **React**, styled with **TailwindCSS**, and powered by **Supabase** for authentication and data persistence, NFL Locked In is fast, modern, and built to scale.  

---

##  What is NFL Locked In?

NFL Locked In is a project built by myself, James McGillicuddy, to better suit an NFL challenge a 
few friends have done for the past couple seasons. The gist of the challenge is that 
each week of the NFL regular season (Weeks 1–18), you pick **one team** you think will win.  
The catch? You can only pick each team **once** all season.  

The challenge is balancing “safe” picks with the risk of saving strong teams for later in the season, all while competing against your friends.  

---

##  How Scoring Works

Scoring isn’t just win or lose, it also depends on how popular your pick was within your group:

- If you’re the **only one** who picked a winning team, you earn the **maximum points**.  
- If multiple people pick the same team, the points are split down to encourage unique strategies.  
- Once a team is used, it’s **locked out** for you the rest of the season.  

This creates a strategic tension:  
Do you pick the clear favorite, knowing others might too? Or take a risk on an underdog for a chance at big points?

---

##  Tech Stack

- **Frontend**: [React](https://react.dev/) with functional components and hooks.  
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) for clean, responsive, glassmorphism-inspired design.  
- **Backend**: [Supabase](https://supabase.com/) for authentication, database, and real-time group updates.  
- **UI Components**: [Headless UI](https://headlessui.com/) and [Heroicons](https://heroicons.com/) for accessible and interactive components.  

This stack keeps the project lightweight, maintainable, and easy to extend with new features (like playoffs support, custom scoring rules, or larger group sizes).

---

##  Groups & Competition

- Groups can hold up to **10 players**.  
- You can join or create multiple groups, maintaining seperate picks in each group.
- Scores update within **15–30 minutes** after games finish.  

---


## Getting Started (Development)

1. Clone the repo:
   ```bash
   git clone https://github.com/JamesM813/NFL-Locked-In
   cd NFL-Locked-In/frontend
   ```
2. Install dependencies (all npm commands run from `frontend/`):
   ```bash
   npm install
   ```
3. Set up environment

   Configure a Supabase project and create `frontend/.env` — see
   [Environment variables](#environment-variables) below for the exact keys.
4. Apply the database migrations:
   ```bash
   supabase db push
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
6. Explore

   From there, you can seed the schedule (`npm run seed`) and wire up the
   cron jobs to get the site fully up and running — see
   [Backend jobs](#backend-jobs). Any questions can be sent to myself at
   jrm803@gmail.com and I'll help as best as I can.

## Developer Reference

All commands run from the `frontend/` directory.

### Environment variables

Create `frontend/.env` with:

| Variable | Used by | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | app + scripts | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | app | same page, `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `npm run seed` only | same page, `service_role` key — **never** prefix with `VITE_`, or Vite may bundle it into public browser JS |

### Seeding the NFL schedule

```bash
NFL_SEASON=2026 npm run seed   # defaults to 2025 when NFL_SEASON is unset
```

Fetches the season schedule from the ESPN API and upserts it into `nfl_schedule`. Requires `SUPABASE_SERVICE_ROLE_KEY` (see above).

### Tests

```bash
npm test             # run unit tests once (Vitest)
npm run test:watch   # watch mode
```

Unit tests cover the core business logic: standings scoring (`utils/scoring.ts`) and weekly team availability (`utils/availableTeams.ts`).

### Database types

```bash
npm run gen:types    # writes src/utils/database.types.ts
```

Generates TypeScript types from the live Supabase schema (requires the Supabase CLI to be logged in: `npx supabase login`). Regenerate after schema migrations to catch schema/code mismatches at compile time.

### Database migrations

```bash
supabase db push     # apply everything in supabase/migrations/
```

Migrations are **not** applied by the frontend deploy. In particular,
`20260726000000_realtime_publication.sql` adds `user_picks` and `nfl_schedule`
to the `supabase_realtime` publication — without it the live-updating standings
and picks silently never fire, because `postgres_changes` subscriptions only
receive events for published tables.

### Backend jobs

Two Deno edge functions live in `supabase/functions/`. Note that the directory
names differ from the deployed function names:

| Directory | Deployed as | Role |
|---|---|---|
| `test-fetch/` | `test-fetch` | Fetches the ESPN scoreboard and upserts games into `nfl_schedule` |
| `NFL-Scraper/` | `nfl-scraper` | Scores finished games' picks, splitting points among duplicate picks |

`.github/workflows/nfl-data-fetch.yml` calls `test-fetch` hourly, and every 15
minutes on Sundays, Mondays, and Thursdays, during Sep–Feb.

Deploy them with `supabase functions deploy` — this is separate from the
frontend deploy, so the repo can drift from what is actually running.

**`CRON_SECRET`**: both functions accept an `x-cron-secret` header and reject
mismatches with a 401. The check *fails open with a warning when the secret is
unset*, so an unconfigured deploy is unprotected rather than broken. To enable
it, set the same value in two places:

- the function environment (`supabase secrets set CRON_SECRET=…`)
- the repository's GitHub Actions secrets, as `CRON_SECRET`

### Season rollover

`app_config.current_season` is the single source of truth. Both edge functions
and the frontend read it — `nfl_schedule` and `user_picks` are season-scoped,
and the "one pick per week / each team once" constraints apply per season, so
past seasons stay intact and viewable read-only.

There is **no code path that advances the season**; it is a manual procedure.
Seed the new season *before* activating it, never the other way round — the
frontend filters every query on season, so a season that is active but unseeded
shows an empty app to everyone.

1. **Seed first.** `test-fetch` reads `?year=` ahead of the config, so this
   writes the new schedule while the app is still on the old season:

   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/test-fetch?year=2027" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H "x-cron-secret: $CRON_SECRET"
   ```

   Check the response reports a non-zero `gamesUpdated` and `errors: 0`.

2. **Verify** before activating — 272 rows across 18 weeks, no null
   `locks_at`, and every team mapped:

   ```sql
   select season, count(*), count(distinct week),
          count(*) filter (where locks_at is null) as missing_locks
   from nfl_schedule where season = 2027 group by season;
   ```

3. **Confirm the previous season finished scoring** (`status = 'pending'`
   should be zero), so nothing is lost:

   ```sql
   select season, count(*) filter (where status = 'pending') as pending
   from user_picks group by season;
   ```

4. **Activate.**

   ```sql
   update app_config set value = '2027' where key = 'current_season';
   ```

5. **Confirm** the fetcher and scorer both report the new season in their logs
   on their next run.

### Deployment

The frontend deploys to Vercel from GitHub `main`. To confirm the live site is
current:

```bash
git fetch origin && git log --oneline origin/main..main
```

Empty output means everything is pushed. Remember that migrations and edge
functions deploy on their own tracks (above).
