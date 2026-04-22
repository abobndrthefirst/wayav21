# Waya

Loyalty passes for merchants — Apple Wallet, Google Wallet, and web.
Vite + React 19 frontend. Supabase (Postgres + Edge Functions) backend.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in Supabase keys
npm run dev                  # http://localhost:5173
```

Required env in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WAYA_ENV=development` (shows a dev banner)

## Environments

| Env | Git branch | URL | Supabase | Banner |
|-----|-----------|-----|----------|--------|
| **Production** | `master` | https://trywaya.com | project `unnheqshkxpbflozechm` (main) | none |
| **Staging** | `staging` | https://staging.trywaya.com | same project, `staging` branch | yellow |
| **PR preview** | any | Vercel preview URL | ephemeral Supabase branch | orange |
| **Local** | — | http://localhost:5173 | dev's choice | orange |

Staging uses [Supabase Branching](https://supabase.com/docs/guides/platform/branching)
on the prod project. StreamPay is pointed at sandbox; Apple Wallet uses a
separate Pass Type ID so staging pushes cannot reach real customer devices.

Full staging setup (one-time): see [`STAGING-RUNBOOK.md`](./STAGING-RUNBOOK.md).

## Release workflow

Every change lands on `staging` first, soaks, then gets promoted to `master`.

```
feature-branch → PR → staging → (review gate) → PR → master → production
```

Before merging `staging` → `master`, run the review gate against
https://staging.trywaya.com:

```
/architecture                                 # architectural impact
/plan-eng-review                              # execution plan
/security-review                              # diff-level security
/cso                                          # secrets, supply chain, infra
/gstack  https://staging.trywaya.com          # headless dogfood
/qa-only https://staging.trywaya.com          # full QA report
```

All six must pass before the promotion PR is merged.

## CI

- `.github/workflows/staging.yml` — on push to `staging`, runs
  `supabase db push` + `supabase functions deploy` against the staging branch
  of the Supabase project. Repo secrets required: `SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_PROJECT_REF`.
- Vercel deploys the frontend automatically from both `master` (production)
  and `staging` (preview bound to `staging.trywaya.com`).

## Repository layout

```
src/
  App.jsx                    # top-level router + pages (monolithic)
  main.jsx                   # entry; mounts <EnvironmentBanner /> + <App />
  components/
    EnvironmentBanner.jsx    # non-prod visual guard
  lib/
    supabase.ts              # env-driven Supabase client
supabase/
  config.toml                # project link (prod ref)
  migrations/                # versioned SQL — applied to every branch
  functions/                 # 17 edge functions (Deno)
  seed.sql                   # demo data — runs on branch create, never on prod
.github/workflows/
  staging.yml                # Supabase deploy on push to staging
```

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # production build (into dist/)
npm run preview    # serve dist/ locally
npm run lint       # eslint
npm run test:e2e   # playwright
```
