import { createContext, useContext, useState, useEffect, useCallback, useRef , useMemo} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { groupsApi } from '../api/groups';
import { useGroupsQuery } from '../hooks/useGroupsQuery';
import { useMembersQuery } from '../hooks/useMembersQuery';
import { queryKeys } from '../hooks/queryKeys';

const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Track auth transitions: when user logs in, force-refetch groups immediately
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current) {
      // Auth just transitioned false → true (login). Force fresh fetch.
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    }
    if (!isAuthenticated && prevAuthRef.current) {
      // Auth just transitioned true → false (logout). Clear cache + state.
      queryClient.clear();
      setSelectedGroupId(null);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, queryClient]);

  // Server-state: groups list via TanStack Query
  const {
    data: groupsData,
    isLoading: groupsFetching,
  } = useGroupsQuery(isAuthenticated);

  // Stable derived value for consumers
  const groups = groupsData ?? [];

  // Synchronously derive currentGroup instead of using useEffect
  // This completely eliminates the "No group selected" flash on login/load.
  const currentGroup = useMemo(() => {
    if (groups.length === 0) return null;
    const found = groups.find(g => g.id === selectedGroupId);
    return found || groups[0]; // Auto-select first group if none selected or found
  }, [groups, selectedGroupId]);

  // Server-state: members for the current group via TanStack Query
  const { data: membersData } = useMembersQuery(currentGroup?.id);
  const allMembers = membersData ?? [];

  const membership = allMembers.find(m => m.user_id === user?.id);
  const isAdmin = membership?.role === 'admin';
  const activeMembers = useMemo(() => {
    const active = allMembers.filter(m => m.is_active);
    if (!user) return active;

    return active.sort((a, b) => {
      // 1. Current user always at the top
      if (a.user_id === user.id) return -1;
      if (b.user_id === user.id) return 1;

      // 2. Admin comes next (if current user is not admin)
      if (a.role === 'admin') return -1;
      if (b.role === 'admin') return 1;

      return 0; // Rest in any order
    });
  }, [allMembers, user]);
  const isPending = currentGroup?.role === 'pending';

  const switchGroup = (groupId) => {
    setSelectedGroupId(groupId);
  };

  const refreshGroups = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.groups });
  }, [queryClient]);

  const refreshMembers = useCallback(() => {
    if (currentGroup) {
      return queryClient.invalidateQueries({ queryKey: queryKeys.members(currentGroup.id) });
    }
  }, [queryClient, currentGroup]);

  const createGroup = async (name, prices) => {
    const newGroup = await groupsApi.createGroup(name, prices);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    return newGroup;
  };

  const joinGroup = async (inviteCode) => {
    const data = await groupsApi.joinGroup(inviteCode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    return data;
  };

  const admitMember = async (userId) => {
    if (!currentGroup) return;
    await groupsApi.admitMember(currentGroup.id, userId);
    await queryClient.invalidateQueries({ queryKey: queryKeys.members(currentGroup.id) });
  };

  const cancelRequest = async () => {
    if (!currentGroup) return;
    await groupsApi.cancelJoinRequest(currentGroup.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
  };

  // Loading = true when:
  // 1. Actively fetching groups (first load or refetch)
  // 2. Authenticated but server data hasn't arrived yet
  const loading = groupsFetching || (isAuthenticated && !groupsData);

  return (
    <GroupContext.Provider value={{
      currentGroup,
      groups,
      membership,
      isAdmin,
      activeMembers,
      allMembers,
      switchGroup,
      createGroup,
      joinGroup,
      admitMember,
      cancelRequest,
      refreshGroups,
      refreshMembers,
      loading,
      isPending
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
}
