# MindMirror

> A quiet place to think, with someone who listens.

A premium, Android-first AI journaling app. React Native + Expo + TypeScript,
backed by Supabase (auth + database) and Google Gemini (reflections),
monetized through Razorpay.

This is not a generic AI chat wrapper. It's an emotionally-tuned
companion: the AI persona is trained to never say "Based on your entry" —
it speaks like a wise friend who has known you for years.

---

## Highlights

- **Apple-Journal-grade UI** — dark-first, warm palette, serif headlines for
  emotional moments, custom SVG mood ribbon, glass tab bar, breathing orb on
  welcome.
- **Production data layer** — Supabase schema with RLS, auto-created profiles,
  voice-notes storage bucket, full audit-able subscriptions table.
- **Real AI memory** — entries are summarized into durable "memory notes"
  (goals, triggers, habits) that future reflections reference naturally.
- **Server-secured payments** — Razorpay orders are signed by a Supabase
  Edge Function so the client never sees `KEY_SECRET`.
- **Defensive everywhere** — app boots without env vars; missing keys are
  surfaced as gentle in-UI messages, never crashes.

---

## Project structure

```
ai-journol-app/
├── app/                     # Expo Router screens (file-based)
│   ├── _layout.tsx          # Root: auth guard, paywall host, splash
│   ├── index.tsx            # Redirects based on session
│   ├── (auth)/              # welcome / onboarding / sign-in / sign-up
│   ├── (tabs)/              # Today / Insights / Memory / You + tab bar
│   ├── compose.tsx          # Full-screen modal: write + reflect
│   ├── entry/[id].tsx       # Entry detail
│   └── paywall.tsx
├── src/
│   ├── components/
│   │   ├── ui/              # Text, Button, Card, GlassCard, Screen, Tag...
│   │   ├── home/            # MoodPicker, PromptCard, StreakBadge, EntryRow
│   │   ├── journal/         # ReflectionCard, EmotionTagsRow, VoiceRecorder
│   │   ├── insights/        # MoodChart, EmotionRing, TrendBullet
│   │   └── paywall/         # Paywall, PaywallHost
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client (AsyncStorage sessions)
│   │   ├── gemini.ts        # AI service + persona prompt
│   │   ├── razorpay.ts      # Razorpay client + plan catalog
│   │   ├── env.ts           # Env access with friendly errors
│   │   └── api/             # auth, entries, profile, memory
│   ├── store/               # Zustand: auth, entries, premium, memory
│   ├── theme/               # colors, typography, spacing, gradients
│   ├── types/               # Domain types (Mood, EmotionTag, JournalEntry...)
│   └── utils/               # date, greeting, prompts, streak, mood
├── supabase/
│   ├── schema.sql           # Tables + RLS + triggers + storage
│   └── functions/
│       └── create-razorpay-order.ts   # Edge Function
├── docs/
│   ├── SETUP.md
│   ├── DESIGN.md
│   └── LAUNCH.md
├── app.json                 # Expo config
└── package.json
```

---

## Quick start

```bash
# 1. Install deps
cd ai-journol-app
npm install

# 2. Configure env
cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
# EXPO_PUBLIC_GEMINI_API_KEY, EXPO_PUBLIC_RAZORPAY_KEY_ID

# 3. Set up Supabase
#    - Create a project at https://supabase.com
#    - Open the SQL editor and paste supabase/schema.sql, run it.
#    - (See docs/SETUP.md for Edge Function deploy + Google Auth)

# 4. Run on Android
npx expo run:android

# 5. Or in Expo Go (no native modules)
npx expo start
# Note: Razorpay and Google Sign-In require a dev-client build, not Expo Go.
```

See **[docs/SETUP.md](./docs/SETUP.md)** for full setup, including how to deploy
the Razorpay edge function and configure Google sign-in.

See **[docs/LAUNCH.md](./docs/LAUNCH.md)** for the Play Store submission
checklist.

See **[docs/DESIGN.md](./docs/DESIGN.md)** for the design system rationale.

---

## Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Expo SDK 51 | Best-in-class RN tooling, OTA, EAS Build |
| Language | TypeScript (strict) | Type safety across data + UI |
| Routing | Expo Router (file-based) | Co-located screens, typed routes |
| State | Zustand | Tiny, hooks-first, no provider tree |
| DB / Auth | Supabase | Postgres + RLS + Auth + Storage in one |
| AI | Gemini 1.5 Flash | Fast, cheap, JSON-mode native |
| Payments | Razorpay | Best in India; UPI / cards / wallets |
| Animations | Reanimated 3 + Moti | 60fps spring-based motion |
| Charts | Custom SVG (react-native-svg) | Full control, no chart-lib bloat |

---

## License

Proprietary — © 2026.
