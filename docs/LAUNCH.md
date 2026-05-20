# MindMirror — Play Store Launch Checklist

Everything you need to ship MindMirror to the Google Play Store.

---

## 1. Pre-launch engineering

- [ ] All env vars set in production EAS profile (Supabase URL/anon, Gemini, Razorpay)
- [ ] Gemini calls moved behind a Supabase Edge Function (don't ship the API key)
- [ ] Razorpay webhook set up to verify payments server-side
- [ ] Supabase email confirmation re-enabled
- [ ] RLS policies verified by signing in as user A and querying user B's rows (must fail)
- [ ] Sentry / Crashlytics configured
- [ ] `npx expo doctor` passes
- [ ] App tested on real Android devices: a low-end (Android 8) and a flagship (Android 14)
- [ ] Cold start under 2 seconds on mid-range Android
- [ ] No console.warn / console.error in release build

---

## 2. App icon ideas

The app icon is the most important asset. Keep it elegant and emotional.

**Concept A — The Orb (recommended)**
- A single soft orb on `#0B0B10`.
- Gradient: lavender `#A78BFA` → rose `#F4B6B6`.
- The orb takes 60-65% of the canvas.
- Subtle inner glow, no outer ring.

**Concept B — The Crescent**
- A thin crescent of light against deep ink, like moonrise.
- Same color story.
- More minimal but harder to read at thumbnail size.

**Concept C — The Reflection**
- Two orbs, one faint above another (a "mirror").
- Tells the product story but visually busier.

Avoid wordmarks inside the icon — the silhouette has to read at 24×24px in
the notification tray.

Required sizes:
- `icon.png` — 1024×1024 (Play Store + iOS)
- `adaptive-icon.png` — 1024×1024 (transparent foreground, ink background defined in `app.json`)
- `notification-icon.png` — 96×96 (white silhouette on transparent — Android requirement)
- Feature graphic for the Play Store — 1024×500

---

## 3. Onboarding copy (final)

The 4 onboarding slides ship with this copy. Each builds on the last.

| Slide | Eyebrow | Headline | Body |
| --- | --- | --- | --- |
| 1 | Write freely | Not a diary. A conversation. | Type or speak. Short or long. There is no right way. |
| 2 | Get reflected | A second voice, gentle and yours. | After you write, MindMirror responds — never advice, just clarity. |
| 3 | See yourself | Your week, in emotional color. | Soft patterns surface over time. Triggers, joys, recurring themes. |
| 4 | Stays private | Encrypted. Yours alone. | Entries live in your account. We never sell or share what you write. |

Final CTA: **"Create account"** (then sign-in option).

---

## 4. Subscription strategy

**Free tier (intentionally generous):**
- Unlimited text journaling
- 3 AI reflections per week
- 7-day mood graph
- Daily prompt
- Streak

**Premium (₹199/mo · ₹1499/yr · ₹4999 lifetime):**
- Unlimited AI reflections
- Voice journaling (with transcription)
- AI memory (cross-entry context)
- 90+ day emotional timeline
- Cinematic weekly recaps
- Advanced emotion analytics

**Pricing rationale:**
- ₹199/mo is positioned just below Calm/Headspace India pricing.
- ₹1499/yr saves 37% — this is the headline plan ("BEST VALUE" badge).
- ₹4999 lifetime captures the segment that distrusts subscriptions; an
  acquisition / superfan tool, not a primary revenue driver.

**Trial:** consider a 7-day free trial of annual via Razorpay subscription
preauthorization (post-MVP). For v1, the generous free tier serves as the
trial.

**Conversion levers:**
1. Soft paywall: feature attempt → modal explaining + showing plans (already
   wired via `usePremiumStore.openPaywall(reason)`).
2. End-of-week prompt: "You journaled X days this week. Your weekly recap
   is ready in Premium."
3. Memory tab as a *visible* upsell — non-premium users see the explainer
   card, not nothing.

---

## 5. Notifications (post-launch v1.1)

The Gemini service exposes `generateNotificationCopy()` for emotionally-aware
push copy. To wire it up:

1. Schedule a daily background task (Expo notifications + a Supabase cron job).
2. The cron job calls `generateNotificationCopy({ memory, lastEntryDaysAgo })`
   server-side and pushes via FCM.
3. Suggested cadence: 1 nudge/day max, sent in the user's evening window
   (7pm-9pm local).

Examples (pre-validated tone):
- "Take a moment for yourself today."
- "You seemed calmer after journaling last week."
- "Your evenings have been heavy. Want to talk about it?"

---

## 6. Play Store listing

**Title (30 chars max):**
> MindMirror — AI Journal

**Short description (80 chars):**
> A quiet AI companion for journaling, mood tracking, and emotional clarity.

**Full description:**

> MindMirror is a private AI journal that listens, reflects, and helps you
> understand yourself.
>
> Write a few sentences. MindMirror responds — gently, specifically, never
> in clinical language. Over time, it notices the patterns: what drains you,
> what lights you up, what you keep returning to.
>
> Designed by people who believe journaling should feel like a conversation
> with a thoughtful friend, not a checklist.
>
> ✦ Daily mood check-in with 8-point emotional spectrum
> ✦ AI reflections after every entry — warm, never robotic
> ✦ Voice journaling for the days writing is too much
> ✦ Beautiful weekly insights — your inner weather, visualized
> ✦ AI memory that remembers your themes across weeks
> ✦ Encrypted, private. Your words stay yours.
>
> MindMirror Premium unlocks unlimited reflections, voice journaling,
> emotional timeline, and cinematic weekly recaps.

**Categories:** Health & Fitness · Lifestyle · Education

**Tags:** journal, mood, mental health, mindfulness, AI companion,
self-reflection, emotional intelligence

**Content rating:** 12+

**Privacy policy URL:** required — host at `https://mindmirror.app/privacy`.

---

## 7. Screenshots (8 required)

Order matters — lead with the emotional hooks, not features:

1. **Welcome** — animated orb + "A quiet place to think."
2. **Home** — greeting + mood picker + prompt card
3. **Composer** — entry being written + emotion tags
4. **Reflection** — the AI response card
5. **Insights** — mood chart + emotion ring
6. **Memory** — categorized notes
7. **Weekly recap** — premium gradient card
8. **Premium** — paywall plans

Use a real device frame (Pixel 8 Pro). Caption each in 4 words max.

---

## 8. Compliance

- [ ] Privacy policy covers: Supabase data storage, Gemini API usage, Razorpay PII
- [ ] Terms of service
- [ ] Data deletion endpoint (`profiles` cascade-deletes entries when user is removed)
- [ ] In-app "Export entries" — JSON dump from `journal_entries` table (settings stub provided)
- [ ] Disclose AI use in store listing (Play policy update 2024)
- [ ] Disclose subscription terms in-app and in store listing

---

## 9. Day-1 metrics to instrument

- Activation: % of installs that complete first entry within 24h (target: 35%)
- Retention: D1, D7, D30
- Reflection completion rate (entries that successfully get an AI reflection)
- Free → Premium conversion (target: 4-6% in first 30 days)
- Average entries per active user per week (target: 3+)

Add these via Supabase analytics or PostHog before launch.

---

## 10. Soft launch plan

1. **Internal testing track** (Play Console) — your team, 1 week.
2. **Closed alpha** — 50-100 users via email list. Iterate based on
   feedback. 2 weeks.
3. **Open beta** — 1000+ users. Watch crash rate < 0.5% before promoting.
4. **Production rollout** — 5% → 25% → 50% → 100% over a week.

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Gemini latency hurts reflection UX | Show "A quiet pause..." loading state. Cache reflections. Move to streaming if average > 4s. |
| Users feel surveilled by AI memory | Memory tab shows everything stored, with delete affordance. Privacy copy is explicit. |
| Razorpay payment failure rate | Webhook handler reconciles. Surface friendly retry CTA. |
| Cold start jank on low-end Android | Lazy-load chart libs. Avoid Reanimated-heavy screens above the fold. |
| AI says something insensitive | Gemini safety filters set to BLOCK_ONLY_HIGH. Persona prompt explicitly forbids advice / clinical language. Add a "Report this reflection" link in v1.1. |
