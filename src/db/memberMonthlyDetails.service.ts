import { getMemberById } from './members.repo';
import { getEntriesForMemberMonth, type MealType } from './entries.repo';
import { getPriceForDate } from './prices.repo';
import { getDaysInMonth } from '@/utils/dateHelpers';

export interface DayDetail {
  date: string; // 'yyyy-MM-dd'
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  dayTotal: number;
}

export interface MemberMonthlyDetailsData {
  member: { id: number; name: string };
  month: string;
  morningCount: number;
  afternoonCount: number;
  nightCount: number;
  morningTotal: number;
  afternoonTotal: number;
  nightTotal: number;
  grandTotal: number;
  days: DayDetail[];
  prices: { morning: number; afternoon: number; night: number };
}

/**
 * Build complete per-day attendance + expense data for a single member
 * in a given month. Reuses existing repo methods — no new queries.
 */
export async function getMemberMonthlyDetails(
  memberId: number,
  monthStr: string
): Promise<MemberMonthlyDetailsData | null> {
  const member = await getMemberById(memberId);
  if (!member) return null;

  // Get all calendar days for the month
  const allDays = getDaysInMonth(monthStr);

  // Get the member's meal entries for this month
  const entries = await getEntriesForMemberMonth(memberId, monthStr);

  // Build a lookup: date -> set of meal types where they ate
  const entryMap = new Map<string, Set<MealType>>();
  for (const entry of entries) {
    if (!entryMap.has(entry.date)) {
      entryMap.set(entry.date, new Set());
    }
    entryMap.get(entry.date)!.add(entry.meal_type);
  }

  // Get prices (use end-of-month date for the representative price)
  const lastDay = allDays[allDays.length - 1];
  const morningPrice = await getPriceForDate('morning', lastDay);
  const afternoonPrice = await getPriceForDate('afternoon', lastDay);
  const nightPrice = await getPriceForDate('night', lastDay);

  // Build day-by-day details and aggregate counts
  let morningCount = 0;
  let afternoonCount = 0;
  let nightCount = 0;
  let morningTotal = 0;
  let afternoonTotal = 0;
  let nightTotal = 0;

  const days: DayDetail[] = allDays.map((date) => {
    const meals = entryMap.get(date);
    const morning = meals?.has('morning') ?? false;
    const afternoon = meals?.has('afternoon') ?? false;
    const night = meals?.has('night') ?? false;

    if (morning) {
      morningCount++;
      morningTotal += morningPrice;
    }
    if (afternoon) {
      afternoonCount++;
      afternoonTotal += afternoonPrice;
    }
    if (night) {
      nightCount++;
      nightTotal += nightPrice;
    }

    const dayTotal =
      (morning ? morningPrice : 0) +
      (afternoon ? afternoonPrice : 0) +
      (night ? nightPrice : 0);

    return { date, morning, afternoon, night, dayTotal };
  });

  const grandTotal = morningTotal + afternoonTotal + nightTotal;

  return {
    member: { id: member.id, name: member.name },
    month: monthStr,
    morningCount,
    afternoonCount,
    nightCount,
    morningTotal,
    afternoonTotal,
    nightTotal,
    grandTotal,
    days,
    prices: { morning: morningPrice, afternoon: afternoonPrice, night: nightPrice },
  };
}
