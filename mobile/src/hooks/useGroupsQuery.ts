import { useQuery } from '@tanstack/react-query';
import { getGroups } from '../api/groups';
import { queryKeys } from '../query/queryKeys';

export function useGroupsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: getGroups,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
