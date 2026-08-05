import { getDb } from './database';
import { todayStr } from '@/utils/dateHelpers';

export interface Member {
  id: number;
  name: string;
  is_active: number;
  created_at: string;
}

export async function addMember(name: string): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO members (name, is_active, created_at) VALUES (?, 1, ?)',
    [name.trim(), todayStr()]
  );
  return result.lastInsertRowId;
}

export async function getActiveMembers(): Promise<Member[]> {
  const db = await getDb();
  return db.getAllAsync<Member>(
    'SELECT * FROM members WHERE is_active = 1 ORDER BY name ASC'
  );
}

export async function getAllMembers(): Promise<Member[]> {
  const db = await getDb();
  return db.getAllAsync<Member>('SELECT * FROM members ORDER BY name ASC');
}

export async function deactivateMember(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE members SET is_active = 0 WHERE id = ?', [id]);
}

export async function reactivateMember(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE members SET is_active = 1 WHERE id = ?', [id]);
}

export async function getMemberById(id: number): Promise<Member | null> {
  const db = await getDb();
  return db.getFirstAsync<Member>('SELECT * FROM members WHERE id = ?', [id]);
}
