# Waya — Session Log, April 15 2026

Everything we touched today, why, and what the diff is.

---

## 1. Wallet enrollment bug: "this card is not available"

### Symptom
iPhone and Android customers scanning the enrollment QR saw "card is not available." Mac worked fine.

### Root cause
The enrollment page loads the loyalty program and shop via the Supabase anon key. RLS was missing a policy that allows anon SELECT on `loyalty_programs` and `shops` when `is_active = true`. Mac worked because of a logged-in session; phones didn't have one.

### Fix
Created `supabase/migrations/20260415000010_public_read_active_programs.sql`:

```sql
drop policy if exists "public read active programs" on loyalty_programs;
create policy "public read active programs"
  on loyalty_programs for select to anon
  using (is_active = true);

drop policy if exists "public read shops of active programs" on shops;
create policy "public read shops of active programs"
  on shops for select to anon
  using (exists (
    select 1 from loyalty_programs
    where loyalty_programs.shop_id = shops.id
      and loyalty_programs.is_active = true
  ));
```

First attempt used `CREATE POLICY IF NOT EXISTS` — Postgres doesn't support that syntax on policies. Fixed with drop-then-create.

---

## 2. Wallet enrollment bug: form submitted, no "Add to wallet" button appeared

### Symptom
Customer fills in name/phone, clicks submit, gets a blank success screen — no Apple/Google Wallet button. Ran deploys with `--no-verify-jwt`, still broken.

### Anti-pattern avoided
I initially assumed it was an auth/JWT/credentials problem. User pushed back hard: "stop making assumptions — investigate." Good call.

### Root cause
Used the Supabase MCP `get_logs` tool to pull real edge function logs. Both `apple-wallet-public` and `google-wallet-public` were returning **422, not 401**. The 422 came from `_shared/validation.ts`:

```ts
const KSA_PHONE_RE = /^(?:\+?966|0)?5\d{8}$/;
```

Non-Saudi phone numbers were being rejected silently. The frontend was also **swallowing the error** — `.catch((err) => console.error(...))` with no state update, so it still showed the success screen even on total failure.

### Fix
Two changes in `src/components/WalletEnrollPage.jsx`:
1. Added client-side KSA phone validation mirror (new `src/lib/phone.js`) with live red-border invalid state and a hint ("must start with 05, 10 digits").
2. Replaced the silent-swallow `.catch` with a failures array — success screen only shown if at least one wallet provider returned OK. Otherwise the real server error bubbles up to the user.

### Plus
Per the user's instruction, applied the same KSA phone rules to `src/App.jsx` customer form (~line 2628) with digit-only `inputMode`, red border when invalid, hint text, and a `handleSubmit` guard that blocks submission on invalid input.

### New file
`src/lib/phone.js` — mirrors `_shared/validation.ts` regex on the client. Exports `isValidKsaPhone`, `normalizeKsaPhone`, `handlePhoneChange`, `sanitizePhoneInput`, plus EN/AR hint and error strings.

---

## 3. Commits pushed to `github.com/abobndrthefirst/wayav21`

On `main`:
- `63bc0a1` — RLS migration for anon read on active programs/shops
- `f367eb7` — client-side KSA phone validation + UX hints across web app
- `116bec6` — stop swallowing wallet enrollment errors; surface real server errors

---

## 4. Flutter merchant app (new)

### Scope
Native iOS + Android app for merchants. Matches the web app's colors (dark theme, Waya green `#10B981`). Features:
- Email/password login (Supabase).
- Google Sign-In (native SDK → Supabase `signInWithIdToken`).
- Language toggle EN/العربية, persisted; Arabic forces RTL.
- QR scanner that only accepts codes whose bounding box sits inside the centered frame.
- Add points / add stamp / redeem reward with `+1 / +5 / +10` quick buttons.
- Phone-number fallback search (KSA format, same validation as server).
- Idempotency key (`x-idempotency-key`) on every write so double-taps can't double-credit.

### How the wallet gets updated in seconds
1. Scanner reads the QR (Apple passes encode `apple_serial`; Google passes encode `google_object_id` — we query `.or(...)` so either works).
2. Shop ownership check (`shop.user_id == auth.currentUser.id`).
3. `AddPointsScreen` calls the `points-update` edge function.
4. That function mutates `customer_passes` and enqueues both `apns_push_jobs` (Apple Wallet) and `google_wallet_update_jobs` (Google Wallet).
5. Customer's wallet card updates within seconds.

### Files created

```
waya_merchant/
  pubspec.yaml                       # Flutter 3.19+, supabase_flutter, google_sign_in,
                                     #   mobile_scanner, shared_preferences, intl, uuid,
                                     #   flutter_launcher_icons (dev)
  lib/
    main.dart                        # WayaApp + AuthGate (StreamBuilder on auth state)
    theme.dart                       # WayaColors, Material 3 dark theme
    i18n.dart                        # EN/AR flat maps, SharedPreferences persistence,
                                     #   `'key'.tr` extension
    supabase_client.dart             # Reads SUPABASE_URL/ANON + Google client IDs
                                     #   via --dart-define
    widgets/
      language_toggle.dart           # AppBar chip: "EN" / "ع"
      scanner_overlay.dart           # Dim + green L-bracket corners (CustomPainter)
    screens/
      login_screen.dart              # Email/pass + native Google Sign-In
      home_screen.dart               # Loads shop; two cards: scan (primary green) + phone search
      scanner_screen.dart            # MobileScanner, frame clipping, ownership check,
                                     #   navigates to AddPointsScreen on match
      add_points_screen.dart         # Header card (name/phone/balance), amount +
                                     #   quick buttons, calls points-update with
                                     #   idempotency key
      phone_search_screen.dart       # Fallback lookup by phone + shop_id
  ios/Runner/Info.plist              # NSCameraUsageDescription, Google URL scheme,
                                     #   EN+AR localizations
  assets/logo.png                    # 1024×1024 Waya logo (from src/assets/waya-logo.png)
  README.md                          # Setup: Flutter, pods, Google OAuth, --dart-define,
                                     #   TestFlight, Android AAB
  .gitignore
  SESSION_LOG_2026-04-15.md          # This file
```

### Flutter run fixes applied during first build

- Version conflict: `intl: ^0.19.0` → `^0.20.2` (forced by `flutter_localizations`).
- CocoaPods conflict between `mobile_scanner 5.x` and `google_sign_in 6.x` on `GoogleUtilities`: bumped `mobile_scanner` to `^7.2.0`.
- iOS deployment target bumped 13.0 → 15.0 in `ios/Podfile` (MLKit requirement).
- Flutter 3.41 API change: `CardTheme(...)` → `CardThemeData(...)` in `lib/theme.dart`.
- mobile_scanner 7 API change: `errorBuilder: (ctx, err, _)` → `(ctx, err)` in `lib/screens/scanner_screen.dart`.

### App icons + login screen logo
- Added `flutter_launcher_icons` dev dep.
- `pubspec.yaml` flutter_launcher_icons block generates all iOS + Android + Android adaptive icons from `assets/logo.png`.
- Login screen swapped the placeholder green-square icon for the real `assets/logo.png` (160×160).

### Pushed to GitHub
Branch: `flutter-merchant-app` on `github.com/abobndrthefirst/wayav21`
- Commit: `Add Waya Merchant Flutter app (iOS + Android)`
- Note: this branch is a root-commit, not branched off `main`, because local `main` had no commits when the branch was created. If a clean PR diff against `main` is wanted, the branch can be redone off `origin/main` later.

---

## 5. Environments — discussed, not yet done

User asked about staging. Outcome of discussion:
- Supabase Pro Branching costs ~$9.68/month per branch. Shares org-level secrets with prod.
- **Cheaper + more isolated alternative: second free-tier Supabase project** as staging. $0/month, completely separate auth users / keys / DB. Sandbox creds for Apple/Google Wallet on staging. Can pair with a `staging` branch in Vercel pointing at the staging Supabase.
- Plus local dev via `supabase start` (Docker) for merge-pre-work.

Decision pending: user to create "Waya Staging" project in the same org and hand back the project ref.

---

## 6. Device setup on Sultan's Mac

- Flutter upgraded to 3.41.6 via `brew install --cask flutter`.
- `flutter doctor`: all green (Flutter, Android SDK 36.1.0, Xcode 16.4, Chrome, 3 devices, network).
- iPhone "Sully" (iOS 26.3.1) connected via cable, signing team `56P7BFZD72`, dev identity `Apple Development: sl67edr@outlook.com (RW8QKKM9ZB)`.
- First `flutter run` on iPhone worked after the five fixes above.

---

## 7. What's next (not done today)

- Android build on physical phone or emulator.
- Google OAuth client setup in Google Cloud (iOS client + Web client) and paste the IDs into the `--dart-define` flags — currently only email/password login works.
- Staging Supabase project + Vercel staging env vars.
- `GoogleService-Info.plist` + `REVERSED_CLIENT_ID` swap in `ios/Runner/Info.plist` before App Store submission.
- TestFlight first build.
- Optional: clean up the `flutter-merchant-app` branch to be a proper branch off `main` instead of a root-commit.

---

Generated 2026-04-15 during a Cowork session with Claude.
