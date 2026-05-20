# MindMirror — Design System

Notes for designers and engineers shipping new screens. The goal is a
single, coherent emotional voice across every pixel.

---

## Voice

The app speaks like **a thoughtful friend in a quiet room**, not a product.
Three rules:

1. **Acknowledge before suggesting.** Reflections always start by mirroring
   what the user feels. Suggestions, if any, come last.
2. **Match their energy.** A 3-word entry gets a 1-sentence response. A
   paragraph gets 2-3 sentences. Never overwrite their feeling.
3. **Specific over generic.** Reference real details from the entry. Never
   "It seems you had a difficult day."

Forbidden phrasing (hard-coded into the Gemini prompt):
> "Based on your entry…", "I notice that…", "It seems like…",
> "I understand that…", clinical/diagnostic words, weather metaphors.

---

## Color system

Dark-first. Light mode is intentionally not shipped in v1 — the emotional
experience is calibrated for night-sky surfaces.

### Backgrounds (ink)
| Token | Hex | Use |
| --- | --- | --- |
| `bgInset` | `#08080C` | Behind everything, deep void |
| `bg` | `#0B0B10` | Primary screen background |
| `bgElevated` | `#111118` | Cards |
| `bgSurface` | `#171722` | Inset modules |
| `bgRaised` | `#1F1F2E` | Selected states |

### Text (mist)
| Token | Hex | Use |
| --- | --- | --- |
| `text` | `#FAF8F4` | Headlines, primary copy |
| `textSecondary` | `#C9C9D6` | Body |
| `textMuted` | `#9494A8` | Meta, captions |
| `textFaint` | `#6E6E84` | Hints, disabled |

### Accents (dawn / dusk)
| Token | Hex | Use |
| --- | --- | --- |
| `accent` | `#A78BFA` | Primary CTA, AI moments |
| `accentSoft` | `#C4B5FD` | Eyebrows, secondary |
| `palette.peach` | `#F8C4A2` | Warm mood (happy) |
| `palette.rose` | `#F4B6B6` | Emotional warmth |
| `palette.sage` | `#A8C4A2` | Calm, growth |
| `palette.sky` | `#9DC6E8` | Tired, hope |
| `palette.amber` | `#E8B86A` | Achievement, streak |
| `palette.clay` | `#C9907A` | Sad, grounded |

Mood tokens map deterministically to the 8 moods (radiant→amber, happy→peach,
calm→sage, neutral→mist, tired→sky, anxious→lavenderSoft, sad→clay,
overwhelmed→rose).

### Surfaces (glass)
| Token | rgba | Use |
| --- | --- | --- |
| `glass` | `0.04` white | Quiet glass cards |
| `glassStrong` | `0.07` white | Active/selected glass |
| `glassBorder` | `0.08` white | Hairline borders on glass |

---

## Typography

Two voices. Never mix within a sentence.

| Variant | Family | Size | Use |
| --- | --- | --- | --- |
| `display` | Fraunces | 40 / 46 | Welcome, paywall hero |
| `hero` | Fraunces | 32 / 38 | Tab heroes |
| `title` | Fraunces medium | 24 / 30 | Card titles, prompts |
| `journal` | Fraunces | 18 / 30 | Long-form entry body |
| `h1`, `h2` | Inter semibold | 22 / 18 | Section headers |
| `body`, `bodyMedium` | Inter | 16 / 24 | UI body |
| `small` | Inter | 14 / 20 | Meta |
| `caption` | Inter medium | 12 / 16 | Eyebrows |
| `overline` | Inter medium, tracked | 11 / 14 | "TODAY'S PROMPT" labels |

Optional: install `Fraunces` and `Inter` via `expo-font`. Without them, the
app falls back to system serif/sans, which is still acceptable.

---

## Spacing

4-point grid, but most screens only use a few values:

- **`lg` (24)** — horizontal screen gutter
- **`xl` (32)** — vertical breathing between sections
- **`xxl` (48)** — big emotional gaps before hero copy
- **`base` (16)** — between fields in a form
- **`sm` (8)** — chip padding, dot offsets

Whitespace is sacred. When in doubt, add more.

---

## Motion

Every animation pulls from `springs` in `theme/spacing.ts`:

```ts
springs.gentle  // damping 22, stiffness 160 — default
springs.soft    // damping 18, stiffness 130 — onboarding fades
springs.snappy  // damping 26, stiffness 240 — button press
```

Rules:
- No bounce overshoot above 5%.
- Press scale: 0.97, never 0.92.
- Stagger delays: 100ms increments. Never more than 4 elements.
- Welcome orb breathes at 3.2s in/out — slower than your heartbeat on purpose.

---

## Components

### Hierarchy

```
Screen
  └─ GradientBackground (optional)
       └─ SafeArea / KeyboardAvoiding / Scroll
            └─ Card / GlassCard
                 └─ Text | Tag | Button
```

### Card vs GlassCard

- **`Card`** — quiet, opaque, used 90% of the time.
- **`GlassCard`** — translucent + blur, reserved for hero moments
  (welcome orb, prompt card, AI reflection card, paywall plans).

If everything is glass, nothing is. Use sparingly.

### Button variants

- `primary` — bone gradient, ink text. The "yes" action.
- `glass` — translucent, light text. Secondary actions on dark gradients.
- `soft` — dusk gradient. Used inside glass cards so they don't disappear.
- `ghost` — transparent. Tertiary, like "sign out".

---

## Anti-patterns

Do **not**:

- Use solid neon-colored buttons. The accent stays muted.
- Add drop shadows to flat ink surfaces — use translucency for depth.
- Use full-height gradients on every screen. Reserve them for emotional beats.
- Animate position + scale + opacity at once. Pick one or two.
- Use serif for UI labels or sans for journal body.
- Use emoji anywhere. Color and motion carry the emotional weight.

---

## Iconography

Ionicons (outline variants almost always). When an icon is "active" you
swap to the filled version (e.g. `pulse-outline` → `pulse`). Never tint
inactive icons brighter than `textMuted`.
