/**
 * Curated journaling prompts. Rotates daily.
 * Tone: warm, specific, never therapy-coded.
 */

const PROMPTS = [
  'What softened you today?',
  'Name one thing your body is asking for.',
  'Who took up space in your head today \u2014 and why?',
  'What did you almost say but didn\u2019t?',
  'What\u2019s a small win you haven\u2019t given yourself credit for?',
  'Where did you feel most yourself this week?',
  'What\u2019s heavier than it needs to be right now?',
  'Describe today in three textures.',
  'What\u2019s one thing you\u2019re ready to release?',
  'When did you last feel quietly proud?',
  'What conversation are you avoiding?',
  'What does your evening need from you?',
  'What did you learn from the way today went sideways?',
  'Who are you becoming, slowly?',
  'What would today look like if you trusted yourself a little more?',
];

export function promptForToday(date = new Date()): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}

export const ALL_PROMPTS = PROMPTS;
