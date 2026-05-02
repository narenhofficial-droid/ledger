import {
  startOfMonth, endOfMonth, startOfDay, endOfDay,
  format, subMonths, addDays, differenceInDays, parseISO, isToday,
} from 'date-fns';

// Calendar month boundaries (you chose calendar month, not custom start day)
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

export function relativeDay(dateStr) {
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(d)) return 'Today';
  const diff = differenceInDays(new Date(), d);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return format(d, 'EEEE');
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
