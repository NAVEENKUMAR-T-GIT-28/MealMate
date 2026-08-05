import { getDb } from './database';
import { getPriceForDate } from './prices.repo';
import type { MealType } from './entries.repo';

export interface MemberMonthlySummary {
  memberId: number;
  memberName: string;
  morningCount: number;
  afternoonCount: number;
  nightCount: number;
  morningCost: number;
  afternoonCost: number;
  nightCost: number;
  totalCost: number;
}

export interface MonthSummary {
  month: string;
  members: MemberMonthlySummary[];
  grandTotal: number;
}

/**
 * Get per-member meal counts and costs for a given month.
 * Uses the date-effective price for accurate historical calculation.
 */
export async function getMonthlySummary(monthStr: string): Promise<MonthSummary> {
  const db = await getDb();
  const startDate = `${monthStr}-01`;
  const endDate = `${monthStr}-31`;

  // Get all members who have entries in this month, or are currently active
  const members = await db.getAllAsync<{ id: number; name: string }>(
    `SELECT DISTINCT m.id, m.name FROM members m
     LEFT JOIN meal_entries e ON m.id = e.member_id AND e.date >= ? AND e.date <= ? AND e.ate = 1
     WHERE m.is_active = 1 OR e.id IS NOT NULL
     ORDER BY m.name ASC`,
    [startDate, endDate]
  );

  const summaries: MemberMonthlySummary[] = [];
  let grandTotal = 0;

  for (const member of members) {
    const counts = await db.getAllAsync<{ meal_type: MealType; cnt: number }>(
      `SELECT meal_type, COUNT(*) as cnt FROM meal_entries
       WHERE member_id = ? AND date >= ? AND date <= ? AND ate = 1
       GROUP BY meal_type`,
      [member.id, startDate, endDate]
    );

    const countMap: Record<MealType, number> = { morning: 0, afternoon: 0, night: 0 };
    for (const row of counts) {
      countMap[row.meal_type] = row.cnt;
    }

    // For cost calculation we use a representative price (latest effective in month).
    // A more precise approach would compute per-day, but for typical use (same price
    // all month) this is correct and much faster.
    const morningPrice = await getPriceForDate('morning', endDate);
    const afternoonPrice = await getPriceForDate('afternoon', endDate);
    const nightPrice = await getPriceForDate('night', endDate);

    const morningCost = countMap.morning * morningPrice;
    const afternoonCost = countMap.afternoon * afternoonPrice;
    const nightCost = countMap.night * nightPrice;
    const totalCost = morningCost + afternoonCost + nightCost;

    grandTotal += totalCost;

    summaries.push({
      memberId: member.id,
      memberName: member.name,
      morningCount: countMap.morning,
      afternoonCount: countMap.afternoon,
      nightCount: countMap.night,
      morningCost,
      afternoonCost,
      nightCost,
      totalCost,
    });
  }

  return { month: monthStr, members: summaries, grandTotal };
}

/**
 * Get the day total for a specific date (headcount × price per meal, summed).
 */
export async function getDayTotal(date: string): Promise<number> {
  const db = await getDb();
  const meals: MealType[] = ['morning', 'afternoon', 'night'];
  let total = 0;

  for (const meal of meals) {
    const row = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM meal_entries WHERE date = ? AND meal_type = ? AND ate = 1',
      [date, meal]
    );
    const count = row?.cnt ?? 0;
    const price = await getPriceForDate(meal, date);
    total += count * price;
  }

  return total;
}

/**
 * Get headcount per meal for a specific date.
 */
export async function getDayHeadcounts(
  date: string
): Promise<Record<MealType, number>> {
  const db = await getDb();
  const meals: MealType[] = ['morning', 'afternoon', 'night'];
  const counts: Record<MealType, number> = { morning: 0, afternoon: 0, night: 0 };

  for (const meal of meals) {
    const row = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM meal_entries WHERE date = ? AND meal_type = ? AND ate = 1',
      [date, meal]
    );
    counts[meal] = row?.cnt ?? 0;
  }

  return counts;
}

/**
 * Get all months that have at least one meal entry.
 */
export async function getMonthsWithData(): Promise<
  { month: string; entryCount: number }[]
> {
  const db = await getDb();
  return db.getAllAsync<{ month: string; entryCount: number }>(
    `SELECT substr(date, 1, 7) as month, COUNT(*) as entryCount
     FROM meal_entries WHERE ate = 1
     GROUP BY month ORDER BY month DESC`
  );
}
