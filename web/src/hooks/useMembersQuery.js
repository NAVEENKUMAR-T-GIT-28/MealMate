import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../api/groups';
import { queryKeys } from './queryKeys';

/**
 * Fetches members for a specific group.
 * Members change infrequently — 5 min staleTime.
 */
export function useMembersQuery(groupId) {
  return useQuery({
    queryKey: queryKeys.members(groupId),
    queryFn: () => groupsApi.getMembers(groupId),
    staleTime: 5 * 60 * 1000,
    enabled: !!groupId,
  });
}
