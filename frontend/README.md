# frontend

The NFL Locked In web app — React 19 + Vite, TailwindCSS 4, shadcn/ui, Supabase.

All npm commands run from this directory:

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b + production build
npm run lint       # ESLint
npm run preview    # preview the production build
npm test           # Vitest
npm run seed       # seed the NFL schedule (needs SUPABASE_SERVICE_ROLE_KEY)
npm run gen:types  # regenerate src/utils/database.types.ts
```

Setup, environment variables, database migrations, cron jobs, and deployment
are documented in the [root README](../README.md). Architecture notes for
working in this codebase are in [CLAUDE.md](../CLAUDE.md).
