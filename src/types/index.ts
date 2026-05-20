/**
 * Core domain types — shared across stores, screens, and services.
 */

export type Mood =
  | 'radiant'
  | 'happy'
  | 'calm'
  | 'neutral'
  | 'tired'
  | 'anxious'
  | 'sad'
  | 'overwhelmed';

export const MOOD_ORDER: Mood[] = [
  'radiant',
  'happy',
  'calm',
  'neutral',
  'tired',
  'anxious',
  'sad',
  'overwhelmed',
];

export const MOOD_VALUE: Record<Mood, number> = {
  radiant: 5,
  happy: 4,
  calm: 3.5,
  neutral: 3,
  tired: 2.5,
  anxious: 2,
  sad: 1.5,
  overwhelmed: 1,
};

export const MOOD_LABEL: Record<Mood, string> = {
  radiant: 'Radiant',
  happy: 'Happy',
  calm: 'Calm',
  neutral: 'Neutral',
  tired: 'Tired',
  anxious: 'Anxious',
  sad: 'Sad',
  overwhelmed: 'Overwhelmed',
};

export type EmotionTag =
  | 'grateful'
  | 'inspired'
  | 'hopeful'
  | 'loved'
  | 'focused'
  | 'restless'
  | 'lonely'
  | 'angry'
  | 'jealous'
  | 'guilty'
  | 'embarrassed'
  | 'proud'
  | 'curious'
  | 'creative'
  | 'numb'
  | 'sensitive';

export const EMOTION_TAGS: EmotionTag[] = [
  'grateful',
  'inspired',
  'hopeful',
  'loved',
  'focused',
  'proud',
  'curious',
  'creative',
  'restless',
  'lonely',
  'angry',
  'jealous',
  'guilty',
  'embarrassed',
  'numb',
  'sensitive',
];

export type JournalEntry = {
  id: string;
  user_id: string;
  created_at: string; // ISO
  body: string;
  mood: Mood | null;
  emotions: EmotionTag[];
  voice_url: string | null;
  /** Soft local-only field — can be ungated later. */
  word_count: number;
  reflection_id: string | null;
};

export type Reflection = {
  id: string;
  entry_id: string;
  user_id: string;
  summary: string; // 1-2 warm sentences
  insight: string; // pattern observation
  question: string; // gentle reflective question
  detected_emotions: EmotionTag[];
  detected_mood: Mood | null;
  created_at: string;
};

export type MemoryNote = {
  id: string;
  user_id: string;
  /** Short, declarative — "User finds large social events draining". */
  content: string;
  category: 'stress' | 'goal' | 'habit' | 'relationship' | 'trigger' | 'value';
  weight: number; // 0..1 — how often referenced
  last_seen_at: string;
  created_at: string;
};

export type WeeklyInsight = {
  week_start: string; // YYYY-MM-DD
  user_id: string;
  mood_average: number;
  most_common_emotions: EmotionTag[];
  trends: string[]; // bullet phrases
  highlight: string; // hero sentence
  triggers: string[];
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  premium_until: string | null;
  streak_count: number;
  last_entry_at: string | null;
  timezone: string | null;
  created_at: string;
  // Notifications
  expo_push_token: string | null;
  notifications_enabled: boolean;
  notification_hour: number; // 0-23 in user's local TZ
  last_notified_at: string | null;
};
