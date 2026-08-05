import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonthStr(): string {
  return format(new Date(), 'yyyy-MM');
}

export function formatDate(date: Date | string, pattern = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateDisplay(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE, dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatMonth(monthStr: string): string {
  try {
    const d = parseISO(`${monthStr}-01`);
    return format(d, 'MMMM yyyy');
  } catch {
    return monthStr;
  }
}

export function formatMonthShort(monthStr: string): string {
  try {
    const d = parseISO(`${monthStr}-01`);
    return format(d, 'MMM yyyy');
  } catch {
    return monthStr;
  }
}

export function getDaysInMonth(monthStr: string): string[] {
  const start = startOfMonth(parseISO(`${monthStr}-01`));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function addDays(dateStr: string, days: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy-MM-dd');
}

export function getMonthFromDate(dateStr: string): string {
  return dateStr.substring(0, 7); // 'yyyy-MM'
}
