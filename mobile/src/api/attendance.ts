import client from './client';

export type MealType = 'morning' | 'afternoon' | 'night';

export interface AttendanceRecord {
  date: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  user_id: number;
  member_name: string;
}

export interface ToggleAttendancePayload {
  group_id: number;
  date: string;
  meal_type: MealType;
}

export async function getAttendance(groupId: number, date?: string, month?: string): Promise<AttendanceRecord[]> {
  const params: Record<string, any> = { group_id: groupId };
  if (date) params.date = date;
  if (month) params.month = month;

  const { data } = await client.get('/attendance', { params });
  return data;
}

export async function toggleAttendance(payload: ToggleAttendancePayload): Promise<any> {
  const { data } = await client.put('/attendance/toggle', payload);
  return data;
}
