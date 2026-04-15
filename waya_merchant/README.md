# Waya Merchant (Flutter)

Native iOS + Android app for Waya merchants. Scan a customer's loyalty QR (or look them up by phone), add points/stamps, and the customer's Apple/Google Wallet pass updates within seconds — because the same `points-update` edge function that the web dashboard uses enqueues the APNs + Google Wallet push jobs.

Matches the web app's look (dark theme, Waya green `#10B981`, Arabic + English with RTL).

## Features

- Email + password login (Supabase).
- Google Sign-In (native SDK → Supabase `signInWithIdToken`).
- Language toggle EN / العربية (persisted; Arabic forces RTL).
- QR scanner — only detections whose bounding box sits inside the framed rectangle are accepted, so stray codes in the background are ignored.
- Add points / add stamp / redeem reward with quick `+1 / +5 / +10` buttons.
- Phone-number fallback (KSA format, validated same as server).
- Idempotency key on every write so double-taps can't double-credit.

## Prerequisites

- Flutter 3.19+ (`flutter --version`)
- Xcode 15+ for iOS, Android Studio for Android
- A Supabase project (the existing Waya project)
- Google Cloud OAuth clients:
  - **iOS** client (bundle id = your iOS bundle id)
  - **Web** client (used as the `serverClientId` for Google Sign-In on iOS to issue an ID token Supabase can verify)
  - **Android** client (SHA-1 of your debug + release keystores)

## 1. Install

```bash
cd waya_merchant
flutter pub get
cd ios && pod install && cd ..
```

## 2. Configure Google Sign-In

### iOS

1. Download `GoogleService-Info.plist` for your iOS OAuth client and drop it into `ios/Runner/`.
2. Open `ios/Runner/Info.plist` and replace `REVERSED_CLIENT_ID` with the `REVERSED_CLIENT_ID` value from that plist (e.g. `com.googleusercontent.apps.123456-abcdef`).

### Android

1. Add the SHA-1 of your signing keys to the Android OAuth client in Google Cloud.
2. No code change needed — `google_sign_in` picks the client up automatically from the package name.

### Supabase

In the Supabase dashboard → Authentication → Providers → Google, enable Google and paste the **Web** client's client ID + secret. This is what verifies the ID token from the native SDK.

## 3. Run

Pass the config via `--dart-define`:

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGci... \
  --dart-define=GOOGLE_WEB_CLIENT_ID=XXXXXXXXXX-web.apps.googleusercontent.com \
  --dart-define=GOOGLE_IOS_CLIENT_ID=XXXXXXXXXX-ios.apps.googleusercontent.com
```

On iOS, open `ios/Runner.xcworkspace` in Xcode once to set your Team and bundle identifier before the first build.

## 4. Build for release

### iOS / TestFlight

```bash
flutter build ipa \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=GOOGLE_WEB_CLIENT_ID=... \
  --dart-define=GOOGLE_IOS_CLIENT_ID=...
```

Then upload `build/ios/ipa/*.ipa` via Transporter or `xcrun altool`.

### Android

```bash
flutter build appbundle --dart-define=...
```

Upload the `.aab` to Google Play Console.

## How scanning + add-points reaches the wallet

1. Scanner reads the QR. Customer Apple passes encode `apple_serial`; Google passes encode `google_object_id`. The app queries `customer_passes` with `.or(...)` so either works.
2. Shop ownership check (`shop.user_id == auth.currentUser.id`) — merchants can only update their own customers.
3. `AddPointsScreen` calls the `points-update` edge function with an `x-idempotency-key` header.
4. That function mutates `customer_passes` and enqueues:
   - `apns_push_jobs` → customer's iPhone taps Apple's APNs → Apple Wallet re-fetches the pass.
   - `google_wallet_update_jobs` → Google Wallet object is patched.
5. The customer sees the new balance on their phone in seconds.

The phone-search fallback does the same thing, just without the camera.

## Repository layout

```
lib/
  main.dart                    # WayaApp + AuthGate
  theme.dart                   # Waya colors / Material 3 dark
  i18n.dart                    # EN / AR strings, locale persistence
  supabase_client.dart         # Reads SUPABASE_URL/ANON via --dart-define
  widgets/
    language_toggle.dart
    scanner_overlay.dart       # Dim + green L-brackets
  screens/
    login_screen.dart
    home_screen.dart
    scanner_screen.dart        # Only accepts codes inside the frame
    add_points_screen.dart     # Calls points-update
    phone_search_screen.dart   # Fallback lookup
ios/Runner/Info.plist          # NSCameraUsageDescription, URL schemes
```
