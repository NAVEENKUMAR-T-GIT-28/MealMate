import client from './client';
import { MemberMonthlySummary } from '../components/SummaryTable';

export interface MonthlySummaryResponse {
  month: string;
  members: MemberMonthlySummary[];
  grandTotal: number;
}

export async function getMonthlySummary(groupId: number, month: string): Promise<MonthlySummaryResponse> {
  const { data } = await client.get(`/summary/${month}`, {
    params: { group_id: groupId },
  });
  return data;
}
