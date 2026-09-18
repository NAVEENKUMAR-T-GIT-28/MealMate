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
  },
  updateMemberStatus: async (groupId, userId, isActive) => {
    const response = await client.put(`/groups/${groupId}/members/${userId}/status`, { is_active: isActive });
    return response.data;
  },
  removeMember: async (groupId, userId) => {
    const response = await client.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  }
};
