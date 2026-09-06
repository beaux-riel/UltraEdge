import { parseDateOnly, formatDateOnly, daysUntilDate } from '../lib/dateOnly';

it('round-trips the selected calendar day without UTC conversion', () => {
  const date = parseDateOnly('2026-09-19')!;
  expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 19]);
  expect(formatDateOnly(date)).toBe('2026-09-19');
  // Picker values may carry any time, including shortly after midnight or evening.
  expect(formatDateOnly(new Date(2026, 8, 19, 0, 15))).toBe('2026-09-19');
  expect(formatDateOnly(new Date(2026, 8, 19, 23, 45))).toBe('2026-09-19');
});
it('counts overnight date boundaries rather than remaining 24-hour periods', () => {
  expect(daysUntilDate('2026-09-19', new Date(2026, 8, 19, 23, 59))).toBe(0);
  expect(daysUntilDate('2026-09-20', new Date(2026, 8, 19, 23, 59))).toBe(1);
  expect(daysUntilDate('2026-09-19', new Date(2026, 8, 20, 0, 1))).toBe(-1);
});
it('counts correctly across spring and fall daylight-saving boundaries', () => {
  expect(daysUntilDate('2026-03-09', new Date(2026, 2, 7, 23))).toBe(2);
  expect(daysUntilDate('2026-11-02', new Date(2026, 9, 31, 1))).toBe(2);
});
it('rejects impossible dates and accepts leap days', () => {
  expect(parseDateOnly('2026-02-29')).toBeNull();
  expect(parseDateOnly('2026-13-01')).toBeNull();
  expect(parseDateOnly('garbage')).toBeNull();
  expect(parseDateOnly('2028-02-29')).not.toBeNull();
  expect(daysUntilDate(null)).toBeNull();
});
