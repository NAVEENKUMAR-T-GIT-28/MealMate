import { useQuery } from '@tanstack/react-query';
import { getMonthlySummary, MonthlySummaryResponse } from '../api/summary';
import { queryKeys } from '../query/queryKeys';

export function useSummaryQuery(
  groupId: number | null | undefined,
  month: string,
  enabled: boolean = true
) {
  return useQuery<MonthlySummaryResponse>({
    queryKey: queryKeys.summary(groupId ?? 0, month),
    queryFn: () => getMonthlySummary(groupId!, month),
    enabled: enabled && !!groupId && !!month,
    staleTime: 1000 * 60 * 5,
  });
}
