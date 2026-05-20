/**
 * Time-aware greetings. The phrasings here are intentional —
 * never robotic ("Good morning, USER!"). They feel like a small
 * note someone left for you on the kitchen counter.
 */

const dawn = [
  'Soft start.',
  'A new page.',
  'Quiet morning.',
  'Take your time.',
];
const morning = [
  'Good morning.',
  'You\u2019re early.',
  'A clear morning.',
];
const midday = [
  'Mid-day check-in.',
  'How\u2019s today landing?',
  'A small pause.',
];
const evening = [
  'Soft evening.',
  'The day is settling.',
  'Welcome back.',
];
const night = [
  'Late, but here.',
  'A quiet hour.',
  'Before you sleep.',
];

function pick(arr: string[], seed: number): string {
  return arr[seed % arr.length];
}

export function greetingFor(date = new Date(), name?: string | null): {
  primary: string;
  secondary: string;
} {
  const hour = date.getHours();
  const seed = date.getDate(); // stable for the day
  const firstName = (name ?? '').split(' ')[0]?.trim();

  let primary: string;
  let secondary: string;

  if (hour < 6) {
    primary = pick(dawn, seed);
    secondary = firstName ? `Hi, ${firstName}.` : 'Hi.';
  } else if (hour < 11) {
    primary = pick(morning, seed);
    secondary = firstName
      ? `How are you waking up, ${firstName}?`
      : 'How are you waking up?';
  } else if (hour < 16) {
    primary = pick(midday, seed);
    secondary = firstName ? `Hi, ${firstName}.` : 'Just for a minute.';
  } else if (hour < 21) {
    primary = pick(evening, seed);
    secondary = firstName ? `Hi, ${firstName}.` : 'Tell me about today.';
  } else {
    primary = pick(night, seed);
    secondary = firstName ? `Rest soon, ${firstName}.` : 'Rest soon.';
  }

  return { primary, secondary };
}
