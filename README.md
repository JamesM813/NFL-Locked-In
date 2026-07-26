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
   cd NFL-Locked-In
2. Install dependancies
    ```bash
    npm install
3. Set up environment
    Configure a Supabase project and add local environment variables to ```.env```
4. Run the dev server
    ```bash
    npm run dev
5. Explore
    From there, you can explore other scripts like seeding and schedule cron jobs to get the site fully up and running.
    Any questions can be sent to myself at jrm803@gmail.com and I'll help as best as I can.

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
