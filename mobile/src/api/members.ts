import client from './client';

export interface GroupMember {
  user_id: number;
  name: string;
  role: 'admin' | 'member' | 'pending';
  is_active: boolean;
  joined_at: string;
}

export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
  const { data } = await client.get(`/groups/${groupId}/members`);
  return data;
}
