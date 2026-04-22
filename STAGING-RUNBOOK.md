# Staging Environment — One-Time Setup Runbook

This runbook walks through standing up `https://staging.trywaya.com` for the
first time. Most of it is human-only work (billing, Apple Developer, DNS) —
Claude/scripts can't do it for you. Expect ~2–3 hours end to end.

The in-repo code changes (env banner, seed.sql, CI workflow, function guards,
README) already shipped. What's left is the provisioning.

Prereqs:
- Admin access to the Supabase project `unnheqshkxpbflozechm`
- Admin access to the Vercel project (Team Owner or Project Admin)
- DNS access for `trywaya.com`
- Apple Developer account with Pass Type ID issuance rights
- `supabase` CLI ≥ 1.200 (`brew install supabase/tap/supabase`)
- `vercel` CLI (`npm i -g vercel`)

---

## Step 1 — Upgrade Supabase to Pro

Branching requires Pro ($25/mo) + branch compute (~$10/mo per active branch).

1. https://supabase.com/dashboard/project/unnheqshkxpbflozechm/settings/billing
2. Upgrade to **Pro**.
3. Under **Project Settings → Branching**, click **Enable Branching**.

Cost check-in: one persistent staging branch ≈ $35/mo all-in.

## Step 2 — Register a staging Apple Pass Type ID

Do NOT reuse the prod Pass Type ID on staging. This is the isolation boundary
that keeps staging pushes from reaching real customers.

1. https://developer.apple.com/account/resources/identifiers/list/passTypeId
2. **Register a new Pass Type ID**:
   - Description: `Waya Loyalty — Staging`
   - Identifier: `pass.com.trywaya.loyalty.staging`
3. Generate a signing certificate for the new Pass Type ID.
4. Download the `.cer`, convert to PEM, export the signing key PEM. Save
   alongside your prod PEMs — label clearly as `staging`.

## Step 3 — Create the `staging` git branch

```bash
cd ~/Downloads/Waya--main     # or wherever the repo lives
git checkout master
git pull
git checkout -b staging
git push -u origin staging
```

This branch is long-lived. Feature branches PR into it. It PRs into `master`
only after the review gate passes.

## Step 4 — Create the persistent Supabase branch

```bash
export SUPABASE_ACCESS_TOKEN=<personal token from supabase.com/dashboard/account/tokens>
supabase link --project-ref unnheqshkxpbflozechm
supabase branches create staging --persistent
```

Supabase auto-runs `supabase/migrations/*.sql` and `supabase/seed.sql` against
the new branch. Verify:

```bash
supabase branches list
```

You should see `staging` with an API URL and anon key. Copy both.

## Step 5 — Set staging edge-function secrets

Against the staging branch:

```bash
supabase secrets set --branch staging \
  WAYA_ENV=staging \
  WAYA_HASH_PEPPER=$(openssl rand -hex 32) \
  WAYA_ENROLLMENT_SECRET=$(openssl rand -hex 32) \
  WAYA_CRON_SECRET=$(openssl rand -hex 32) \
  APPLE_PASS_TYPE_ID=pass.com.trywaya.loyalty.staging \
  APPLE_TEAM_ID=<same as prod> \
  APPLE_APNS_KEY_ID=<same as prod> \
  APPLE_APNS_AUTH_KEY="<paste prod APNs key>" \
  APPLE_WALLET_SIGNER_KEY_PEM="<paste staging signer key PEM>" \
  APPLE_WALLET_SIGNER_CERT_PEM="<paste staging signer cert PEM>" \
  APPLE_WALLET_WWDR_PEM="<same as prod>" \
  APPLE_WALLET_SIGNER_KEY_PASSWORD="<staging key password>" \
  STREAMPAY_X_API_KEY="<sandbox key>" \
  STREAMPAY_SANDBOX_EMAIL=sandbox@trywaya.test \
  STREAMPAY_SANDBOX_PHONE=+966500000000 \
  SITE_URL=https://staging.trywaya.com
```

Audit afterwards:

```bash
supabase secrets list --branch staging
```

## Step 6 — Deploy edge functions to the staging branch

From the `staging` git branch:

```bash
supabase functions deploy --branch staging
```

This deploys all 17 functions. Sanity-check one:

```bash
curl https://<staging-branch-url>.supabase.co/functions/v1/health
```

## Step 7 — Add Vercel env vars scoped to staging

```bash
vercel login
vercel link                                 # link to the Waya project

# VITE_SUPABASE_URL for staging only
echo "https://<staging-branch-url>.supabase.co" | \
  vercel env add VITE_SUPABASE_URL preview --git-branch=staging

# VITE_SUPABASE_ANON_KEY for staging only
echo "<staging anon key>" | \
  vercel env add VITE_SUPABASE_ANON_KEY preview --git-branch=staging

# Flag the banner
echo "staging" | vercel env add VITE_WAYA_ENV preview --git-branch=staging
```

Verify:

```bash
vercel env ls
```

## Step 8 — Assign the staging domain

1. In Vercel → Project → Settings → Domains → Add `staging.trywaya.com`.
2. When prompted, bind it to git branch `staging`.
3. Vercel emits a DNS target (e.g., `cname.vercel-dns.com`).
4. In your DNS provider, add:
   ```
   CNAME  staging.trywaya.com  →  cname.vercel-dns.com
   ```
5. Wait for Vercel to issue SSL (~1–5 min).

## Step 9 — Wire up GitHub Actions secrets

Needed for `.github/workflows/staging.yml`:

```bash
gh secret set SUPABASE_ACCESS_TOKEN --body "<your personal token>"
gh secret set SUPABASE_PROJECT_REF --body "unnheqshkxpbflozechm"
```

(Or via the GitHub UI: Settings → Secrets and variables → Actions.)

## Step 10 — Trigger the first staging deploy

From the `staging` branch, make a trivial change to force a deploy:

```bash
git commit --allow-empty -m "chore(staging): initial deploy"
git push origin staging
```

Watch:
- Vercel dashboard — frontend build should land at `staging.trywaya.com`
- GitHub Actions → `Deploy to Supabase Staging Branch` — migrations/functions

## Step 11 — Install the Vercel↔Supabase integration (optional)

Nice-to-have for per-PR ephemeral branches. Skip for v1 if you're cost-averse;
each ephemeral branch adds compute time.

1. https://vercel.com/integrations/supabase → Add.
2. Pick the Waya Vercel project and Supabase project.
3. Opt in to **Branching → Auto-create per PR**.

Note: the integration adds `SUPABASE_*` (not `VITE_*`) env vars. The
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` you set in Step 7 will be
per-branch only; for auto-provisioned ephemeral branches you may need a
`vite.config.js` adapter (out of scope here).

## Step 12 — Run the verification checklist

From the plan, with evidence for each:

1. **Visual**: visit https://staging.trywaya.com → yellow banner at top.
   https://trywaya.com → no banner.
2. **Isolation**: DevTools → Network → Supabase host = staging branch URL.
3. **Signup**: create a merchant on staging. Log into prod — merchant must
   not exist.
4. **Pass enrollment**: enroll a pass on staging. Open the `.pkpass` → check
   `passTypeIdentifier == pass.com.trywaya.loyalty.staging`.
5. **Wallet push**: trigger a stamp on staging. Check Supabase logs for
   `[STAGING]` tag on APNs events.
6. **StreamPay sandbox**: start a checkout → transaction in StreamPay
   sandbox dashboard, not prod.
7. **Cron**: Supabase branch → Logs → pg_cron; all 5 jobs firing.
8. **CI**: push a no-op migration; watch the workflow pass.
9. **Gate dry-run**: against staging, run `/architecture`,
   `/plan-eng-review`, `/security-review`, `/cso`, `/gstack`, `/qa-only`.
10. **Prod untouched**: `select count(*) from shops` on prod before and
    after — identical.

If any step fails, fix before declaring staging ready. Do not short-circuit.

---

## Tear-down (if you ever need it)

```bash
supabase branches delete staging
# Vercel dashboard → remove staging.trywaya.com domain
# DNS → remove the CNAME
# GitHub → delete the staging branch
```

Production is untouched.
