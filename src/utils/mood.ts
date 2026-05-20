import { Mood, MOOD_LABEL, MOOD_VALUE } from '@/types';
import { colors } from '@/theme';

export function moodColor(mood: Mood | null): string {
  if (!mood) return colors.textMuted;
  return colors.mood[mood];
}

export function moodLabel(mood: Mood | null): string {
  return mood ? MOOD_LABEL[mood] : 'Untagged';
}

export function moodValue(mood: Mood | null): number {
  return mood ? MOOD_VALUE[mood] : 3;
}

/**
 * The orb glyph for a mood — a single Unicode character that scales as a
 * minimal "icon". We avoid emoji here on purpose; instead we use a soft
 * filled circle and let color do the talking.
 */
export const MOOD_GLYPH = '\u25CF';
