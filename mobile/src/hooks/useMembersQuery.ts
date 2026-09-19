import { useQuery } from '@tanstack/react-query';
import { getGroupMembers, GroupMember } from '../api/members';
import { queryKeys } from '../query/queryKeys';

export function useMembersQuery(groupId?: number | null) {
  return useQuery<GroupMember[]>({
    queryKey: queryKeys.members(groupId ?? 0),
    queryFn: () => getGroupMembers(groupId!),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}
