import client from './client';

export const groupsApi = {
  getGroups: async () => {
    const response = await client.get('/groups');
    return response.data;
  },
  createGroup: async (name, prices) => {
    const response = await client.post('/groups', { name, prices });
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
  },
  admitMember: async (groupId, userId) => {
    const response = await client.put(`/groups/${groupId}/members/${userId}/admit`);
    return response.data;
  },
  cancelJoinRequest: async (groupId) => {
    const response = await client.delete(`/groups/${groupId}/cancel-request`);
    return response.data;
  }
};
