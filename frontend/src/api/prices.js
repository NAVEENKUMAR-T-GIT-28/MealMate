import client from './client';

export const pricesApi = {
  getPrices: async (groupId) => {
    const response = await client.get(`/prices?group_id=${groupId}`);
    return response.data;
  },
  setPrice: async (groupId, mealType, price, effectiveFrom) => {
    const response = await client.post('/prices', {
      group_id: groupId,
      meal_type: mealType,
      price: price,
      effective_from: effectiveFrom
    });
    return response.data;
  }
};
