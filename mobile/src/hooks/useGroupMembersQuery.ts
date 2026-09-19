import { useQuery } from '@tanstack/react-query';
import { getGroupMembers, GroupMember } from '../api/members';
import { queryKeys } from '../query/queryKeys';

export function useGroupMembersQuery(groupId: number | null | undefined, enabled: boolean = true) {
  return useQuery<GroupMember[]>({
    queryKey: queryKeys.members(groupId ?? 0),
    queryFn: () => getGroupMembers(groupId!),
    enabled: enabled && !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}
