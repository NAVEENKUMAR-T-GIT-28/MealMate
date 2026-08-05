import { getDb } from './database';
import { todayStr } from '@/utils/dateHelpers';
import type { MealType } from './entries.repo';

export interface MealPrice {
  id: number;
  meal_type: MealType;
  price: number;
  effective_from: string;
}

export interface CurrentPrices {
  morning: number;
  afternoon: number;
  night: number;
}

/**
 * Get the current price for each meal type (latest effective_from <= today).
 */
export async function getCurrentPrices(): Promise<CurrentPrices> {
  const db = await getDb();
  const today = todayStr();
  const meals: MealType[] = ['morning', 'afternoon', 'night'];
  const prices: CurrentPrices = { morning: 0, afternoon: 0, night: 0 };

  for (const meal of meals) {
    const row = await db.getFirstAsync<{ price: number }>(
      `SELECT price FROM meal_prices 
       WHERE meal_type = ? AND effective_from <= ? 
       ORDER BY effective_from DESC, id DESC LIMIT 1`,
      [meal, today]
    );
    if (row) prices[meal] = row.price;
  }

  return prices;
}

/**
 * Get the price for a specific meal type effective on a specific date.
 */
export async function getPriceForDate(
  mealType: MealType,
  date: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ price: number }>(
    `SELECT price FROM meal_prices 
     WHERE meal_type = ? AND effective_from <= ? 
     ORDER BY effective_from DESC, id DESC LIMIT 1`,
    [mealType, date]
  );
  return row ? row.price : 0;
}

/**
 * Update prices — inserts new versioned rows effective from today.
 */
export async function updatePrices(
  morning: number,
  afternoon: number,
  night: number
): Promise<void> {
  const db = await getDb();
  const today = todayStr();

  await db.runAsync(
    'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
    ['morning', morning, today]
  );
  await db.runAsync(
    'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
    ['afternoon', afternoon, today]
  );
  await db.runAsync(
    'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
    ['night', night, today]
  );
}
