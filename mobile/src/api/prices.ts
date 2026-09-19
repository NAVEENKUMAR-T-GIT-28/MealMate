import client from './client';

export interface MealPrice {
  id: number;
  group_id: number;
  meal_type: 'morning' | 'afternoon' | 'night';
  price: number;
  effective_from: string;
  created_at: string;
  created_by?: number;
}

export async function getPrices(groupId: number | string): Promise<MealPrice[]> {
  const { data } = await client.get(`/prices?group_id=${groupId}`);
  return data;
}

export async function setPrice(
  groupId: number,
  mealType: 'morning' | 'afternoon' | 'night',
  price: number,
  effectiveFrom: string
): Promise<MealPrice> {
  const { data } = await client.post('/prices', {
    group_id: groupId,
    meal_type: mealType,
    price,
    effective_from: effectiveFrom,
  });
  return data;
}
