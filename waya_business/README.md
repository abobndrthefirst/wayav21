# Waya Business - Flutter App

Store owner app for managing loyalty cards, scanning customer visits, and tracking rewards.

## Setup

### 1. Database Setup
Run `supabase_migration.sql` in your Supabase SQL Editor to create all required tables.

### 2. Flutter Setup
```bash
cd waya_business
flutter pub get
flutter run
```

### 3. Android Permissions
The QR scanner requires camera permission. Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Architecture

- **Provider** for state management
- **Supabase** for auth + database
- **mobile_scanner** for QR code scanning
- **fl_chart** for analytics charts
- RTL (Arabic) first UI with bilingual support

## Screens

| Screen | Description |
|--------|-------------|
| Login | Email/password auth (same account as web) |
| Signup | New account with username field + demo notice |
| Home | Bottom nav with 5 tabs |
| Dashboard | Stats, charts, recent activity, quick actions |
| Scan | QR scanner + phone number lookup |
| Customers | Searchable/sortable customer list |
| Customer Detail | Stamp card, history, add stamp / redeem |
| Rewards | Create/manage reward definitions |
| Settings | Store info, QR code, loyalty settings, logout |
| Store Setup | First-time store creation wizard |
