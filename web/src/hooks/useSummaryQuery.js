import { useQuery } from '@tanstack/react-query';
import { summaryApi } from '../api/summary';
import { queryKeys } from './queryKeys';

/**
 * Fetches the monthly cost summary for a specific group + month.
 * Summaries are computed server-side — 5 min staleTime.
 * Invalidated explicitly when attendance or prices change.
 */
export function useSummaryQuery(groupId, month) {
  return useQuery({
    queryKey: queryKeys.summary(groupId, month),
    queryFn: () => summaryApi.getSummary(groupId, month),
    staleTime: 5 * 60 * 1000,
    enabled: !!groupId && !!month,
  });
}
