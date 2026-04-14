# Apple Wallet Setup for Waya

This guide gets your Apple Wallet pass signing end-to-end. Do the Apple portal steps first, then paste the secrets into Supabase and deploy the edge functions.

---

## 1. Apple Developer portal (do this once, ~10 min)

Log in at https://developer.apple.com/account.

### 1a. Register a Pass Type ID

1. Certificates, IDs & Profiles → **Identifiers** → click the `+` button.
2. Choose **Pass Type IDs** → Continue.
3. Description: `Waya Loyalty Pass`
4. Identifier: `pass.com.trywaya.loyalty`  (must start with `pass.`)
5. Continue → Register.

### 1b. Generate a CSR (Certificate Signing Request) on your Mac

On your Mac, open **Keychain Access**:

1. Menu: Keychain Access → Certificate Assistant → **Request a Certificate from a Certificate Authority…**
2. User Email: your Apple ID email
3. Common Name: `Waya Pass Type ID`
4. Select **Saved to disk** (not emailed)
5. Save as `waya_pass.certSigningRequest`

> If you don't have a Mac, run this on any machine instead:
> ```bash
> openssl req -new -newkey rsa:2048 -nodes \
>   -keyout waya_pass.key \
>   -out waya_pass.certSigningRequest \
>   -subj "/CN=Waya Pass Type ID/emailAddress=sultanhhaidar@gmail.com"
> ```

### 1c. Create the Pass Type ID certificate

1. Back in the developer portal → Identifiers → click your `pass.com.trywaya.loyalty`.
2. Scroll to **Production Certificates** → **Create Certificate…**
3. Upload `waya_pass.certSigningRequest` → Continue → Download `pass.cer`.

### 1d. Convert cert + key to `.p12`

**If you generated the CSR on Mac (Keychain):**
1. Double-click `pass.cer` to import into Keychain.
2. In Keychain, find "Pass Type ID: pass.com.trywaya.loyalty".
3. Right-click the entry (expand it to see the private key) → **Export "..."** → save as `pass.p12` with a **strong password** (remember it — this is `APPLE_WALLET_CERT_PASSWORD`).

**If you used openssl on Linux:**
```bash
# Convert pass.cer (DER) to PEM
openssl x509 -inform DER -in pass.cer -out pass.pem

# Bundle cert + private key into a .p12
openssl pkcs12 -export \
  -out pass.p12 \
  -inkey waya_pass.key \
  -in pass.pem \
  -passout pass:CHOOSE_A_STRONG_PASSWORD
```

### 1e. Download the Apple WWDR intermediate certificate

Apple signs your pass cert, and Apple Wallet validates the chain via WWDR.

1. Go to https://www.apple.com/certificateauthority/
2. Download **Worldwide Developer Relations - G4** (`AppleWWDRCAG4.cer`).
3. Convert to PEM:
```bash
openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
```

### 1f. Extract cert + key PEM from your .p12 (for Supabase env vars)

```bash
# Extract the cert PEM
openssl pkcs12 -in pass.p12 -clcerts -nokeys -out signerCert.pem -passin pass:YOUR_P12_PASSWORD

# Extract the private key PEM (unencrypted)
openssl pkcs12 -in pass.p12 -nocerts -nodes -out signerKey.pem -passin pass:YOUR_P12_PASSWORD
```

You now have three PEM files:
- `signerCert.pem` — your pass signer cert
- `signerKey.pem` — your pass signer private key
- `wwdr.pem` — Apple WWDR G4 intermediate

### 1g. Find your Team ID

Top-right of developer.apple.com → **Membership** → "Team ID" (10 chars, e.g., `ABCDE12345`).

---

## 2. Put secrets into Supabase

Supabase dashboard → **Project Settings → Edge Functions → Secrets**, add:

| Secret name | Value |
|---|---|
| `APPLE_PASS_TYPE_ID` | `pass.com.trywaya.loyalty` |
| `APPLE_TEAM_ID` | your 10-char Team ID |
| `APPLE_WALLET_SIGNER_CERT` | full contents of `signerCert.pem` (including `-----BEGIN CERTIFICATE-----`) |
| `APPLE_WALLET_SIGNER_KEY` | full contents of `signerKey.pem` |
| `APPLE_WALLET_WWDR_CERT` | full contents of `wwdr.pem` |
| `APPLE_WALLET_ORG_NAME` | `Waya` |

When pasting multi-line PEMs, keep newlines intact — Supabase supports multi-line secrets.

---

## 3. Deploy the edge functions

The two functions in this folder mirror your Google Wallet pattern:

- `apple-wallet` — JWT-authenticated; used by shop owners in the dashboard (LoyaltyTab "Test Pass") for generating a test pass.
- `apple-wallet-public` — public; used by the customer-facing `/wallet/:shopId` page.

Deploy with the Supabase CLI:
```bash
supabase functions deploy apple-wallet
supabase functions deploy apple-wallet-public --no-verify-jwt
```

Or I can deploy them for you via the MCP integration (they're ready to go).

---

## 4. Wire up the UI

The `App.jsx.patch.md` in this folder shows the exact diff to add an **Add to Apple Wallet** button next to the Google Wallet one, in both `LoyaltyTab` and the customer `WalletPage`.

---

## 5. Test on a real iPhone

Apple Wallet passes only install on a real iPhone (not the simulator in Safari).

1. From dashboard → Loyalty → **Test Pass (Apple)** → a `.pkpass` downloads.
2. AirDrop it to your iPhone, or open the download URL in Safari on the phone.
3. Safari shows a preview → tap **Add** → the pass appears in Wallet.

If it opens as a zip instead: your `Content-Type` header is wrong. The edge function sets `application/vnd.apple.pkpass` which is correct.

---

## Common failures & fixes

| Symptom | Fix |
|---|---|
| "Sorry, your Pass cannot be installed to Passbook at this time" | Most commonly: manifest hashes don't match, or the PKCS#7 signature is wrong. Check function logs. |
| Pass opens as a zip in Safari | Response missing `Content-Type: application/vnd.apple.pkpass`. |
| "Certificate not trusted" | Wrong WWDR version — make sure you're using **G4** (not older G1/G2). |
| "Pass Type ID mismatch" | `passTypeIdentifier` in pass.json must exactly equal the cert's Pass Type ID. |
| Icon missing | `icon.png` and `icon@2x.png` are REQUIRED in every pass. The function auto-generates defaults from your shop logo. |
