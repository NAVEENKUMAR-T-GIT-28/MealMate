import { getDb } from './database';

export type MealType = 'morning' | 'afternoon' | 'night';

export interface MealEntry {
  id: number;
  member_id: number;
  date: string;
  meal_type: MealType;
  ate: number;
}

/**
 * Toggle a meal entry. If row doesn't exist, creates with ate=1.
 * If row exists, flips ate between 0 and 1.
 * Returns the new ate value.
 */
export async function toggleMeal(
  memberId: number,
  date: string,
  mealType: MealType
): Promise<number> {
  const db = await getDb();

  const existing = await db.getFirstAsync<MealEntry>(
    'SELECT * FROM meal_entries WHERE member_id = ? AND date = ? AND meal_type = ?',
    [memberId, date, mealType]
  );

  if (!existing) {
    await db.runAsync(
      'INSERT INTO meal_entries (member_id, date, meal_type, ate) VALUES (?, ?, ?, 1)',
      [memberId, date, mealType]
    );
    return 1;
  }

  const newValue = existing.ate === 1 ? 0 : 1;
  await db.runAsync(
    'UPDATE meal_entries SET ate = ? WHERE id = ?',
    [newValue, existing.id]
  );
  return newValue;
}

/**
 * Set all active members to ate=1 for all 3 meals on a given date ("Mark All Full Day").
 */
export async function markAllFullDay(
  memberIds: number[],
  date: string
): Promise<void> {
  const db = await getDb();
  const meals: MealType[] = ['morning', 'afternoon', 'night'];

  for (const memberId of memberIds) {
    for (const meal of meals) {
      await db.runAsync(
        `INSERT INTO meal_entries (member_id, date, meal_type, ate) VALUES (?, ?, ?, 1)
         ON CONFLICT(member_id, date, meal_type) DO UPDATE SET ate = 1`,
        [memberId, date, meal]
      );
    }
  }
}

/**
 * Get all entries for a given date (across all members).
 */
export async function getEntriesForDate(date: string): Promise<MealEntry[]> {
  const db = await getDb();
  return db.getAllAsync<MealEntry>(
    'SELECT * FROM meal_entries WHERE date = ? AND ate = 1',
    [date]
  );
}

/**
 * Get entries for a member in a given month.
 */
export async function getEntriesForMemberMonth(
  memberId: number,
  monthStr: string
): Promise<MealEntry[]> {
  const db = await getDb();
  const startDate = `${monthStr}-01`;
  const endDate = `${monthStr}-31`;
  return db.getAllAsync<MealEntry>(
    'SELECT * FROM meal_entries WHERE member_id = ? AND date >= ? AND date <= ? AND ate = 1',
    [memberId, startDate, endDate]
  );
}
