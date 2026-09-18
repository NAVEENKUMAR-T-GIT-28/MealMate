import client from './client';

export const groupsApi = {
  getGroups: async () => {
    const response = await client.get('/groups');
    return response.data;
  },
  createGroup: async (name) => {
    const response = await client.post('/groups', { name });
    return response.data;
  },
  joinGroup: async (inviteCode) => {
    const response = await client.post('/groups/join', { invite_code: inviteCode });
    return response.data;
  },
  getMembers: async (groupId) => {
    const response = await client.get(`/groups/${groupId}/members`);
    return response.data;
  }
};
