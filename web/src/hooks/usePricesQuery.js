import { useQuery } from '@tanstack/react-query';
import { pricesApi } from '../api/prices';
import { queryKeys } from './queryKeys';

/**
 * Fetches price history for a specific group.
 * Prices change infrequently (admin action) — 5 min staleTime.
 */
export function usePricesQuery(groupId) {
  return useQuery({
    queryKey: queryKeys.prices(groupId),
    queryFn: () => pricesApi.getPrices(groupId),
    staleTime: 5 * 60 * 1000,
    enabled: !!groupId,
  });
}
