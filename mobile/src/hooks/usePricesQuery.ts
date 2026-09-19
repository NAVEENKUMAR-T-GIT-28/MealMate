import { useQuery } from '@tanstack/react-query';
import { getPrices, MealPrice } from '../api/prices';
import { queryKeys } from '../query/queryKeys';

export function usePricesQuery(groupId?: number | string) {
  return useQuery<MealPrice[]>({
    queryKey: queryKeys.prices(groupId || ''),
    queryFn: () => getPrices(groupId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!groupId,
  });
}
