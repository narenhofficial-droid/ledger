import {
  startOfMonth, endOfMonth, startOfDay, endOfDay,
  format, subMonths, addDays, differenceInDays, parseISO, isToday,
} from 'date-fns';

export function thisMonthRange(date = new Date()) {
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

export function lastMonthRange(date = new Date()) {
  const lm = subMonths(date, 1);
  return { from: startOfMonth(lm), to: endOfMonth(lm) };
}

export function todayRange() {
  return { from: startOfDay(new Date()), to: endOfDay(new Date()) };
}

export function lastNMonths(n, date = new Date()) {
  const ranges = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = subMonths(date, i);
    ranges.push({
      label: format(m, 'MMM'),
      key: format(m, 'yyyy-MM'),
      from: startOfMonth(m),
      to: endOfMonth(m),
    });
  }
  return ranges;
}

export function toISODate(d) {
  return format(d, 'yyyy-MM-dd');
}

export function fromISODate(s) {
  return parseISO(s);
}

/**
 * Returns a human-friendly label for a date — handles both past and future dates.
 * Past:   Today / Yesterday / weekday name (≤6 days) / "Mon, 4 Apr" (older)
 * Future: Tomorrow / weekday name (≤6 days ahead) / "4 Aug" (7+ days ahead)
 */
export function relativeDay(dateStr) {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  const now = new Date();
  if (isToday(d)) return 'Today';
  // differenceInDays(d, now): positive = future, negative = past
  const diff = differenceInDays(d, now);
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 6) return format(d, 'EEEE');
  if (diff >= 7) return format(d, 'd MMM');
  // Past
  const past = -diff;
  if (past === 1) return 'Yesterday';
  if (past <= 6) return format(d, 'EEEE');
  return format(d, 'EEE, d MMM');
}

export function nextRecurrence(currentDate, frequency) {
  const d = typeof currentDate === 'string' ? parseISO(currentDate) : currentDate;
  if (frequency === 'monthly') {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return next;
  }
  if (frequency === 'yearly') {
    const next = new Date(d);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  return addDays(d, 30);
}

export { format, addDays, differenceInDays };
