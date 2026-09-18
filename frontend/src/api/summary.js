import client from './client';

export const summaryApi = {
  getSummary: async (groupId, month) => {
    const response = await client.get(`/summary/${month}?group_id=${groupId}`);
    return response.data;
  }
};
