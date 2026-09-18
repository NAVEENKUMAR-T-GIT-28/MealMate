import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, addDays as dfAddDays, subDays } from 'date-fns';

// ── Avatar Color Utility ───────────────────────────────────

const AVATAR_COLORS = [
  '#10B981', '#6366F1', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
];

export function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Date Helpers ───────────────────────────────────────────

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');
export const currentMonthStr = () => format(new Date(), 'yyyy-MM');

export function formatDateDisplay(dateStr) {
  try {
    return format(parseISO(dateStr), 'EEE, dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatMonth(monthStr) {
  try {
    return format(parseISO(`${monthStr}-01`), 'MMMM yyyy');
  } catch {
    return monthStr;
  }
}

export function formatShortMonth(monthStr) {
  try {
    return format(parseISO(`${monthStr}-01`), 'MMM');
  } catch {
    return monthStr;
  }
}

export function addDaysStr(dateStr, days) {
  const d = parseISO(dateStr);
  const result = days > 0 ? dfAddDays(d, days) : subDays(d, Math.abs(days));
  return format(result, 'yyyy-MM-dd');
}

export function getNextMonth(monthStr) {
  const d = parseISO(`${monthStr}-01`);
  return format(addMonths(d, 1), 'yyyy-MM');
}

export function getPrevMonth(monthStr) {
  const d = parseISO(`${monthStr}-01`);
  return format(subMonths(d, 1), 'yyyy-MM');
}

export function getDaysInMonth(monthStr) {
  const start = parseISO(`${monthStr}-01`);
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}
