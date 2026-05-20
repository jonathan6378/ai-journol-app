export { colors, gradients, type ColorTheme } from './colors';
export { typography, fontFamilies, type TypographyVariant } from './typography';
export { spacing, radius, shadow, springs, durations } from './spacing';

import { colors, gradients } from './colors';
import { typography } from './typography';
import { spacing, radius, shadow, springs, durations } from './spacing';

export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  radius,
  shadow,
  springs,
  durations,
} as const;

export type Theme = typeof theme;
