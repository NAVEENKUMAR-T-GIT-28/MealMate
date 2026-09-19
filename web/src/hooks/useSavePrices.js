import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pricesApi } from '../api/prices';
import { queryKeys } from './queryKeys';

/**
 * Mutation hook for saving meal prices.
 *
 * After successful save:
 * - Invalidate prices cache for the group
 * - Invalidate all summaries for the group (summaries depend on prices)
 */
export function useSavePrices(groupId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ morningPrice, afternoonPrice, nightPrice, effectiveFrom }) => {
      const results = await Promise.all([
        pricesApi.setPrice(groupId, 'morning', morningPrice, effectiveFrom),
        pricesApi.setPrice(groupId, 'afternoon', afternoonPrice, effectiveFrom),
        pricesApi.setPrice(groupId, 'night', nightPrice, effectiveFrom),
      ]);
      return results;
    },

    onSuccess: () => {
      // Invalidate prices — new prices are now effective
      queryClient.invalidateQueries({ queryKey: queryKeys.prices(groupId) });

      // Invalidate all summaries for this group — summaries depend on pricing
      queryClient.invalidateQueries({
        queryKey: ['summary', groupId],
      });
    },
  });
}
