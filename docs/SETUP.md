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

You have two options. Pick one — they're mutually exclusive.

### Option A — Direct (dev only)

Quick. The Gemini key ends up in the client bundle, so anyone who pulls
your APK can extract it. Fine for prototypes and screenshots, **not for
production**.

1. https://aistudio.google.com → Get API key.
2. Add to `.env`:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=AI...
   EXPO_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
   ```

### Option B — Proxy via Supabase Edge Function (recommended for prod)

The key lives in Supabase secrets. The client calls a Supabase Edge
Function (`gemini-proxy`) authenticated with the user's JWT; the function
calls Google with the secret key. Includes a per-user rate limit
(30 reqs / 60 s) and graceful safety-block fallbacks.

```bash
# 1. Set the secrets
supabase secrets set GEMINI_API_KEY=AI...
supabase secrets set GEMINI_MODEL=gemini-1.5-flash

# 2. Deploy
supabase functions deploy gemini-proxy
```

3. Note the function URL (printed by the CLI, also visible in the dashboard).
4. Set in `.env`:
   ```
   EXPO_PUBLIC_GEMINI_PROXY_URL=https://<project>.supabase.co/functions/v1/gemini-proxy
   ```

When the proxy URL is set, the client automatically uses it. You can leave
`EXPO_PUBLIC_GEMINI_API_KEY` empty in production builds.

---

## 5. Google Sign-In (optional)

The Google button is hidden automatically when these env vars are unset, so
you can ship without it.

1. **Create OAuth clients** — https://console.cloud.google.com → APIs &
   Services → Credentials → Create credentials → OAuth client ID.
   - **Web application** — used by Supabase to verify the ID token. Copy
     the client ID + secret into Supabase → Auth → Providers → Google.
   - **Android** — package name `com.mindmirror.app`; SHA-1 of your debug
     keystore (`./gradlew signingReport`) and your upload keystore.
   - **iOS** (optional) — bundle ID `com.mindmirror.app`.
2. **Configure `.env`:**
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com   # optional
   ```
3. **Confirm Supabase** — Auth → Providers → Google must be enabled with
   the **Web** client ID/secret.

The native flow is wired in `src/lib/google-auth.ts` and surfaced via
`src/components/auth/GoogleButton.tsx`. The button calls `googleSignIn()`,
hands the ID token to `auth.signInWithGoogle()`, which calls
`supabase.auth.signInWithIdToken({ provider: 'google', token })`. Your
profile row is auto-created by the `handle_new_user` trigger.

> Google Sign-In requires a dev-client build — it does not run in plain
> Expo Go. See §8 below.

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

Razorpay, Google Sign-In, and Expo push notifications are **native modules**.
They don't run in plain Expo Go. You need a development client:

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

## 8. Push notifications

The base schema is extended by `supabase/migrations/0002_notifications.sql`
which adds `expo_push_token`, `notifications_enabled`, `notification_hour`,
and a `notifications_log` table. **Run that migration in your Supabase SQL
editor.**

### 8.1 Local-only reminders (works without any backend)

Out of the box, when a user toggles notifications on in Profile →
Notifications, MindMirror schedules a daily local reminder at the chosen
hour. No server, no token, no cost. Useful for offline use and emulators.

### 8.2 Personalized push from the server

The Edge Function `send-daily-nudge` runs on a schedule, picks users whose
`notification_hour` matches the current local hour, asks Gemini for a
single-line in-character nudge, and sends via Expo's push API.

```bash
# 1. Get an EAS project ID (required for Expo push tokens)
npx eas init

# 2. Add the project ID to app.json under extra.eas.projectId
#    (the `eas init` command does this automatically; verify it ran)

# 3. Set Gemini secrets if you haven't yet
supabase secrets set GEMINI_API_KEY=AI...
supabase secrets set GEMINI_MODEL=gemini-1.5-flash

# 4. Deploy the function
supabase functions deploy send-daily-nudge --no-verify-jwt

# 5. Schedule it via Supabase Dashboard → Database → Cron Jobs:
#    Name:     mindmirror-daily-nudge
#    Schedule: */30 * * * *      (every 30 min)
#    SQL:      select net.http_post(
#                url := 'https://<project>.supabase.co/functions/v1/send-daily-nudge',
#                headers := jsonb_build_object(
#                  'Authorization',
#                  'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
#                  'Content-Type','application/json'),
#                body := '{}'::jsonb);
#    See https://supabase.com/docs/guides/database/extensions/pg_cron
```

The function reads `notifications_enabled = true` users with a non-null
`expo_push_token`, computes their local hour from the `timezone` column
(falls back to UTC), de-dupes within a 23-hour window via
`profiles.last_notified_at`, and writes every send into `notifications_log`.

### 8.3 Permissions and the EAS project ID

`registerForPushNotifications()` requires:
- a physical device (emulators silently can't mint tokens)
- OS-level notification permission
- an EAS project ID set in `app.json → extra.eas.projectId`

If any of those are missing, the local reminder still works — the settings
screen surfaces a friendly explanation in the status box.

---

## 9. Sanity checks

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

## 10. Production prep

- Use the **Gemini proxy** (`EXPO_PUBLIC_GEMINI_PROXY_URL`) — never ship
  `GEMINI_API_KEY` in the client bundle.
- Enable Supabase email confirmation.
- Set up the Razorpay webhook for `payment.captured` (server-side
  signature verification beyond what the client reports).
- Schedule `send-daily-nudge` via pg_cron.
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
