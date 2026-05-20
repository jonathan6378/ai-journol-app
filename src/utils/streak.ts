/**
 * Streak math — counts consecutive days (in the user's local TZ) that have
 * at least one journal entry, ending today or yesterday.
 *
 * Allows 1 grace day so a user who journals at 11:55pm doesn't lose their
 * streak when they next open the app at 12:05am two days later.
 */

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function computeStreak(entryDates: string[]): number {
  if (entryDates.length === 0) return 0;

  const dayKeys = new Set(entryDates.map(dayKey));
  let streak = 0;
  const cursor = new Date();

  // If today has no entry, allow yesterday as start (grace day).
  if (!dayKeys.has(dayKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dayKeys.has(dayKey(cursor.toISOString()))) {
      return 0;
    }
  }

  while (dayKeys.has(dayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
