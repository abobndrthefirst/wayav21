# Wallet Notifications — Deploy + Test Guide

## What shipped

**Backend**
- `supabase/migrations/20260415000009_notifications.sql` — tables for campaigns, sends, quotas, tier limits + atomic quota RPC
- `supabase/functions/send-notification/index.ts` — merchant-triggered broadcast endpoint
- `supabase/functions/process-wallet-jobs/index.ts` — extended to handle new `wallet_message` job kind (apple + google)
- `supabase/functions/google-wallet-update/index.ts` — extended with `addMessage` mode

**Frontend**
- `src/components/NotificationsPanel.jsx` — compose form, quota meter, send history, coming-soon cards
- `src/components/notifications-panel.css`
- `src/App.jsx` — new "Notifications" sidebar tab

**v1 scope:** manual broadcasts only. Birthday / geo / win-back / redemption-confirm show as "Coming Soon" cards.

---

## Deploy (from `~/Documents/wayav21`)

```bash
# 1. Pull the latest
git pull

# 2. Push the new migration
npx supabase@latest db push
# If it fails on migration-version collision, run the repair it suggests, then retry.

# 3. Deploy the edge functions (new + updated)
npx supabase@latest functions deploy send-notification
npx supabase@latest functions deploy process-wallet-jobs
npx supabase@latest functions deploy google-wallet-update

# 4. Redeploy Vercel (picks up the new UI)
# Via dashboard → Deployments → Redeploy
```

No new secrets required. Reuses the wallet_update_jobs queue, so the existing `wallet-jobs-worker` cron already drains notification jobs every 30s.

---

## Test plan

### 1. Quota mechanics (no pushes needed)

In Supabase SQL editor, set your own shop to gold so you have quota:

```sql
update shops set notification_tier = 'gold' where user_id = auth.uid();
```

Then try calling quota RPC directly:

```sql
select notif_check_and_increment('<your-shop-id>'::uuid, 1);
```

Expect: `{"allowed": true, "weekly_used": 1, "weekly_limit": 4, ...}`.

Call it 5 times → 5th should return `{"allowed": false, "reason": "WEEKLY_QUOTA_EXCEEDED", ...}`.

Reset counters to retry:

```sql
delete from notification_quotas where shop_id = '<your-shop-id>';
```

### 2. Merchant UI smoke test

1. Log into the merchant dashboard → click **Notifications** in sidebar.
2. Header shows: tier pill (GOLD), weekly used, monthly used.
3. 4 "Coming soon" cards render with dashed border.
4. Type title + message → **Send now** enables.
5. Click send → success message with recipient count.
6. History list updates with the new campaign.

### 3. End-to-end push (needs at least one real customer pass)

Prerequisites:
- One shop with `notification_tier = 'gold'`
- One `customer_passes` row with either `apple_serial` (+ entries in `apple_device_registrations`) or `google_object_id`

Send a broadcast via the UI. Then in SQL editor:

```sql
-- See the campaign
select id, title, status, recipient_count, delivered_count, failed_count, sent_at
from notification_campaigns
order by created_at desc limit 5;

-- See per-recipient status
select campaign_id, platform, status, delivered_at, last_error
from notification_sends
order by created_at desc limit 20;

-- See the queue jobs
select id, kind, status, attempts, last_error, last_error_code
from wallet_update_jobs
where kind = 'wallet_message'
order by created_at desc limit 20;
```

Within 30–60 seconds, wallet_update_jobs rows should flip to `done` and notification_sends should flip to `delivered`.

### 4. Failure-path check

Force a bad Google object id and confirm:
- Job stays in `pending` with exponential backoff (run_after bumps)
- After 5 attempts → job flips to `dead`
- notification_sends row shows `failed` with `last_error`
- `events` table gets a `google_wallet_api_error` row

---

## Observability for you (admin)

```sql
-- Campaigns this week, across all merchants
select s.name as shop, c.title, c.status, c.recipient_count,
       c.sent_at, c.created_at
from notification_campaigns c
join shops s on s.id = c.shop_id
where c.created_at > now() - interval '7 days'
order by c.created_at desc;

-- Top senders
select s.name as shop, s.notification_tier, count(*) as sends
from notification_campaigns c
join shops s on s.id = c.shop_id
where c.created_at > now() - interval '30 days'
group by 1, 2
order by sends desc;

-- Merchants at or above their weekly limit
select s.name, q.period_key, q.used_count, l.weekly_broadcasts as limit
from notification_quotas q
join shops s on s.id = q.shop_id
join notification_tier_limits l on l.tier = s.notification_tier
where q.scope = 'weekly'
  and q.period_key = to_char(now(), 'IYYY-"W"IW')
  and q.used_count >= l.weekly_broadcasts;
```

Adjust tier limits live without a deploy:

```sql
update notification_tier_limits
set weekly_broadcasts = 6, monthly_broadcasts = 24
where tier = 'gold';
```

Pause a merchant (set them to free temporarily):

```sql
update shops set notification_tier = 'free' where id = '<shop-id>';
```

---

## What to watch after rollout

1. **Delivery rate** — `notification_sends` where `status = 'delivered'` ÷ total. Target: 95%+. If lower, check `last_error` column for patterns.
2. **Quota hit rate** — how many sends return 429. If high → revisit tier caps.
3. **Abuse signals** — any single shop sending wildly outside its tier baseline.
4. **Google `addMessage` 4xx** — if this spikes, the LoyaltyObject may have gone stale; the message mode falls back to the regular points-update PATCH path.
