/** Calendar dates belong to the runner's selected day, not UTC midnight. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  // Noon avoids local midnight transitions in time zones that change clocks then.
  const result = new Date(0);
  result.setFullYear(year, month - 1, day);
  result.setHours(12, 0, 0, 0);
  return result.getFullYear() === year && result.getMonth() === month - 1 && result.getDate() === day
    ? result : null;
}

export function formatDateOnly(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new Error('Choose a valid event date.');
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Count local calendar boundaries, independent of time of day and DST. */
export function daysUntilDate(value: string | null | undefined, today = new Date()): number | null {
  const date = parseDateOnly(value);
  if (!date || !Number.isFinite(today.getTime())) return null;
  const ordinal = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((ordinal(date) - ordinal(today)) / 86400000);
}
