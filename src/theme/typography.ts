/**
 * MindMirror — Typography
 *
 * Two voices:
 *  - "serif" for emotional/headline moments (like a letter to yourself).
 *  - "sans"  for everything else — clean, readable, calm.
 *
 * On Android we fall back to system fonts; if the user installs the optional
 * `Fraunces` and `Inter` families via expo-font we automatically use them.
 */

import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  serif: Platform.select({
    ios: 'Fraunces-Regular',
    android: 'Fraunces-Regular',
    default: 'serif',
  }),
  serifMedium: Platform.select({
    ios: 'Fraunces-Medium',
    android: 'Fraunces-Medium',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: 'System',
  }),
  sansMedium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    default: 'System',
  }),
  sansSemibold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: 'System',
  }),
};

type Variant = TextStyle & { fontFamily?: string };

export const typography: Record<string, Variant> = {
  // Emotional / display — serif
  display: {
    fontFamily: fontFamilies.serif,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  hero: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: fontFamilies.serifMedium,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },

  // Body / UI — sans
  h1: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  small: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  overline: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  // Long-form journaling
  journal: {
    fontFamily: fontFamilies.serif,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 0.1,
  },
};

export type TypographyVariant = keyof typeof typography;
