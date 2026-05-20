/**
 * MindMirror — Color System
 *
 * Philosophy:
 *  - Soft, warm, emotionally calming.
 *  - Dark-first. The night-sky palette is primary; light is secondary.
 *  - Accents are muted, never neon. Borrowed from dawn, dusk, and skin tones.
 *  - Every surface has *depth* through layered translucency, not heavy shadow.
 */

const palette = {
  // Night sky — the canvas
  ink900: '#08080C',
  ink800: '#0B0B10',
  ink700: '#111118',
  ink600: '#171722',
  ink500: '#1F1F2E',
  ink400: '#2A2A3D',
  ink300: '#3A3A52',

  // Warm whites — for elevated content
  bone100: '#FAF8F4',
  bone200: '#F1EDE5',
  bone300: '#E5DFD2',
  bone400: '#C9C2B3',

  // Quiet text grays
  mist100: '#EFEFF6',
  mist200: '#C9C9D6',
  mist300: '#9494A8',
  mist400: '#6E6E84',
  mist500: '#4A4A5C',

  // Accents — muted, dawn-inspired
  lavender: '#A78BFA',     // gentle violet — primary CTA
  lavenderSoft: '#C4B5FD',
  rose: '#F4B6B6',         // dusty rose — emotional warmth
  peach: '#F8C4A2',        // morning peach
  sage: '#A8C4A2',         // calm green
  sky: '#9DC6E8',          // soft blue
  amber: '#E8B86A',        // sunset amber
  clay: '#C9907A',         // grounded clay

  // Functional
  success: '#7BC9A5',
  warning: '#E8B86A',
  danger: '#E89797',
};

export const colors = {
  // Backgrounds (dark mode default)
  bg: palette.ink800,
  bgElevated: palette.ink700,
  bgSurface: palette.ink600,
  bgRaised: palette.ink500,
  bgInset: palette.ink900,

  // Text
  text: palette.bone100,
  textSecondary: palette.mist200,
  textMuted: palette.mist300,
  textFaint: palette.mist400,

  // Borders & dividers (subtle, almost invisible)
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.10)',
  divider: 'rgba(255, 255, 255, 0.04)',

  // Accents
  accent: palette.lavender,
  accentSoft: palette.lavenderSoft,
  accentMuted: 'rgba(167, 139, 250, 0.14)',

  // Mood tokens — used in mood picker, charts, tags
  mood: {
    radiant: palette.amber,
    happy: palette.peach,
    calm: palette.sage,
    neutral: palette.mist200,
    tired: palette.sky,
    anxious: palette.lavenderSoft,
    sad: palette.clay,
    overwhelmed: palette.rose,
  },

  // Glass overlays
  glass: 'rgba(255, 255, 255, 0.04)',
  glassStrong: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Functional
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,

  // Raw palette (escape hatch)
  palette,
} as const;

/**
 * Cinematic gradients used across the app.
 * These are tuned to feel like dusk, dawn, candlelight, and deep night.
 * Avoid using them at full saturation — pair with low alpha.
 */
export const gradients = {
  // Hero — dusk over a still lake
  dusk: ['#1A1430', '#2B1F3D', '#3D2A4A'] as const,

  // Onboarding — first light
  dawn: ['#1F1A2E', '#3D2C4A', '#6B4F6E'] as const,

  // Calm states (after journaling)
  calm: ['#0F1A24', '#1A2A3A', '#2A3A4A'] as const,

  // Reflection card — warm candlelight
  candle: ['#2A1F1A', '#3D2A20', '#4A3328'] as const,

  // Premium / paywall — cinematic deep purple → rose
  premium: ['#1A1226', '#3D1F45', '#6B2F5A'] as const,

  // Subtle sheen on cards — barely there
  sheen: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)'] as const,

  // Mood gradients — used in mood picker chips
  moodWarm: ['#F4B6B6', '#F8C4A2'] as const,
  moodCool: ['#9DC6E8', '#A78BFA'] as const,
  moodCalm: ['#A8C4A2', '#9DC6E8'] as const,
};

export type ColorTheme = typeof colors;
