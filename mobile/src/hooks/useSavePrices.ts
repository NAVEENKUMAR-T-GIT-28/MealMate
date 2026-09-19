import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setPrice } from '../api/prices';
import { queryKeys } from '../query/queryKeys';

interface SavePricesParams {
  morningPrice: number;
  afternoonPrice: number;
  nightPrice: number;
  effectiveFrom: string;
}

/**
 * Mutation hook for saving meal prices.
 *
 * After successful save:
 * - Invalidate prices cache for the group
 * - Invalidate all summaries for the group (summaries depend on prices)
 */
export function useSavePrices(groupId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ morningPrice, afternoonPrice, nightPrice, effectiveFrom }: SavePricesParams) => {
      if (!groupId) throw new Error('Group ID is required');
      
      const results = await Promise.all([
        setPrice(groupId, 'morning', morningPrice, effectiveFrom),
        setPrice(groupId, 'afternoon', afternoonPrice, effectiveFrom),
        setPrice(groupId, 'night', nightPrice, effectiveFrom),
      ]);
      return results;
    },

    onSuccess: () => {
      if (!groupId) return;
      // Invalidate prices — new prices are now effective
      queryClient.invalidateQueries({ queryKey: queryKeys.prices(groupId) });

      // Invalidate all summaries for this group — summaries depend on pricing
      queryClient.invalidateQueries({
        queryKey: ['summary', groupId],
      });
    },
  });
}
