# MindMirror — Setup Guide

Step-by-step, from a clean checkout to a working dev build on a real device.

---

## 1. Prerequisites

- Node 18+
- An Android device or emulator (Play services available)
- An Apple Silicon / Intel Mac if you also want iOS
- Accounts: [Supabase](https://supabase.com), [Google AI Studio](https://aistudio.google.com),
  [Razorpay](https://razorpay.com), [Google Cloud Console](https://console.cloud.google.com) (for Sign-in)

---

## 2. Local install

```bash
git clone <this-repo>
cd ai-journol-app
npm install
cp .env.example .env
```

Open `.env` and fill in real values as you complete each section below.

---

## 3. Supabase

### 3.1 Create the project

1. New project on https://supabase.com (free tier is fine).
2. Settings → API → copy `URL` and `anon public` key into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

### 3.2 Run the schema

1. SQL editor → New query.
2. Paste the contents of `supabase/schema.sql`.
3. Run. It creates: `profiles`, `journal_entries`, `reflections`,
   `memory_notes`, `weekly_insights`, `subscriptions`, RLS policies, the
   `voice-notes` storage bucket, and a trigger that auto-creates a profile
   row on signup.

The schema is idempotent — safe to re-run after edits.

### 3.3 Auth providers

- Authentication → Providers → **Email**: enable. Disable "Confirm email" for
  faster local testing (re-enable for production).
- **Google** (optional): see step 5.

---

## 4. Gemini

1. Go to https://aistudio.google.com → Get API key.
2. Add to `.env`:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=AI...
   EXPO_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
   ```

> ⚠️ Shipping the Gemini key in the client is fine for an MVP but exposes
> you to abuse. For launch, proxy `gemini.ts` through a Supabase Edge
> Function that holds the key server-side.

---

## 5. Google Sign-In (optional)

1. Google Cloud Console → APIs & Services → Credentials.
2. Create **OAuth client ID** → Web (used by Supabase) and Android (for the
   native flow).
3. In Supabase → Authentication → Providers → Google: paste Web client ID +
   secret. Enable.
4. In `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
   ```
5. Wire `auth.signInWithGoogle(idToken)` into your sign-in screen using
   `@react-native-google-signin/google-signin`. The library returns an
   `idToken` that you pass straight through.

---

## 6. Razorpay

### 6.1 Get your keys

- https://dashboard.razorpay.com → Settings → API Keys → Generate.
- Test mode keys (`rzp_test_...`) are fine for development.

### 6.2 Add to client

```
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

### 6.3 Deploy the order Edge Function

The client must NEVER hold `KEY_SECRET`. Orders are created by an Edge Function.

```bash
# Install the Supabase CLI if you don't have it
npm i -g supabase

# Login + link
supabase login
supabase link --project-ref <your-project-ref>

# Set secrets (these live on the server)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your-secret

# Deploy
supabase functions deploy create-razorpay-order
```

The function source is in `supabase/functions/create-razorpay-order.ts`.
It validates the plan + amount against an allow-list, calls Razorpay's
`/v1/orders` API, and returns the order to the client.

### 6.4 (Recommended) Webhook

For production, also create a webhook handler that listens to
`payment.captured` events and updates `subscriptions.status` server-side.
This protects you against tampered client-side reports.

---

## 7. Run on Android

Razorpay and Google Sign-In are **native modules**. They don't run in plain
Expo Go. You need a development client:

```bash
# One-time
npx expo install expo-dev-client
npx expo prebuild --platform android
npx expo run:android
```

Subsequent runs:

```bash
npx expo start --dev-client
# then scan the QR with the dev client app on device
```

---

## 8. Sanity checks

- [ ] App boots → Welcome screen with breathing orb
- [ ] Sign up with email creates a profile row in `profiles`
- [ ] Pick a mood + write something + Save creates an entry in `journal_entries`
- [ ] Reflection appears within ~3 seconds, persisted in `reflections`
- [ ] Insights tab shows the mood ribbon
- [ ] Profile → Premium → tap a plan → Razorpay sheet opens (test card: `4111 1111 1111 1111`, any future expiry, any CVV)
- [ ] After payment, `subscriptions` has a row, `profiles.is_premium = true`,
      Memory tab is unlocked.

If any step fails, check the device logs:

```bash
npx react-native log-android
```

Most failures will be caused by missing env vars — the app will print a
warning instead of crashing.

---

## 9. Production prep

- Move Gemini calls behind a server.
- Enable Supabase email confirmation.
- Set up the Razorpay webhook for payment.captured.
- Add Sentry / Crashlytics.
- Run `npx expo doctor` and fix any reported issues.
- Configure EAS Build (`eas.json`) for signed Play Store builds.

---

## Troubleshooting

**"Gemini returned an empty response"**
Usually a safety filter trip. The persona prompt already loosens these to
`BLOCK_ONLY_HIGH`, but extreme content can still trigger them.

**"Razorpay key not configured"**
You're missing `EXPO_PUBLIC_RAZORPAY_KEY_ID`. Or you're running in Expo
Go — switch to a dev-client build.

**"Could not parse AI reflection"**
Gemini occasionally returns prose despite `responseMimeType: application/json`.
The `safeJSON` helper in `gemini.ts` handles most cases; if it persists, try
lowering `temperature` from `0.85` to `0.7` in `geminiFetch`.
