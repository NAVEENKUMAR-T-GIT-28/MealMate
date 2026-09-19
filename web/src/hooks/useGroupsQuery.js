import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../api/groups';
import { queryKeys } from './queryKeys';

/**
 * Fetches all groups the current user belongs to.
 * Groups change infrequently — 5 min staleTime.
 */
export function useGroupsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => groupsApi.getGroups(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
