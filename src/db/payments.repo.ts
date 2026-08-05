import { getDb } from './database';

export interface Payment {
  id: number;
  member_id: number;
  month: string;
  amount_paid: number;
  note: string | null;
}

export async function recordPayment(
  memberId: number,
  month: string,
  amount: number,
  note?: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO payments (member_id, month, amount_paid, note) VALUES (?, ?, ?, ?)',
    [memberId, month, amount, note ?? null]
  );
}

export async function getPaymentsForMonth(month: string): Promise<Payment[]> {
  const db = await getDb();
  return db.getAllAsync<Payment>(
    'SELECT * FROM payments WHERE month = ? ORDER BY id DESC',
    [month]
  );
}

export async function getTotalPaidByMember(
  memberId: number,
  month: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE member_id = ? AND month = ?',
    [memberId, month]
  );
  return row?.total ?? 0;
}

export async function deletePayment(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
}
