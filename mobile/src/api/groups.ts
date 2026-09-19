import client from './client';

export interface Group {
  id: number;
  name: string;
  invite_code: string;
  created_at: string;
  role: string;
}

export async function getGroups(): Promise<Group[]> {
  const { data } = await client.get('/groups');
  return data;
}

export async function createGroup(name: string, prices?: { morning?: number; afternoon?: number; night?: number }): Promise<Group> {
  const { data } = await client.post('/groups', { name, prices });
  return data;
}

export async function joinGroup(inviteCode: string): Promise<{ message: string; group: { id: number; name: string } }> {
  const { data } = await client.post('/groups/join', { invite_code: inviteCode });
  return data;
}

export async function updateMemberStatus(groupId: number, userId: number, isActive: boolean): Promise<any> {
  const { data } = await client.put(`/groups/${groupId}/members/${userId}/status`, { is_active: isActive });
  return data;
}

export async function removeMember(groupId: number, userId: number): Promise<any> {
  const { data } = await client.delete(`/groups/${groupId}/members/${userId}`);
  return data;
}

export async function admitMember(groupId: number, userId: number): Promise<any> {
  const { data } = await client.put(`/groups/${groupId}/members/${userId}/admit`);
  return data;
}

export async function cancelJoinRequest(groupId: number): Promise<any> {
  const { data } = await client.delete(`/groups/${groupId}/cancel-request`);
  return data;
}
