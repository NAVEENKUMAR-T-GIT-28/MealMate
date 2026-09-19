import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useGroupsQuery } from '../hooks/useGroupsQuery';
import { createGroup as apiCreateGroup, joinGroup as apiJoinGroup, Group } from '../api/groups';
import { queryKeys } from '../query/queryKeys';

interface GroupContextType {
  groups: Group[];
  currentGroup: Group | null;
  selectedGroupId: number | null;
  switchGroup: (groupId: number) => void;
  createGroup: (name: string, prices?: { morning?: number; afternoon?: number; night?: number }) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<{ message: string; group: { id: number; name: string } }>;
  admitMember: (userId: number) => Promise<void>;
  cancelRequest: () => Promise<void>;
  isAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const {
    data: groupsData,
    isLoading: isGroupsLoading,
    isError,
    error,
    refetch,
  } = useGroupsQuery(isAuthenticated);

  // Synchronize auth state: reset group selection when unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedGroupId(null);
    }
  }, [isAuthenticated]);

  const groups = useMemo(() => groupsData ?? [], [groupsData]);

  // Synchronously derive currentGroup to prevent flash
  const currentGroup = useMemo(() => {
    if (groups.length === 0) return null;
    const found = groups.find((g) => g.id === selectedGroupId);
    return found || groups[0];
  }, [groups, selectedGroupId]);

  const switchGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
  };

  const createGroup = async (name: string, prices?: { morning?: number; afternoon?: number; night?: number }) => {
    const newGroup = await apiCreateGroup(name, prices);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    if (newGroup?.id) {
      setSelectedGroupId(newGroup.id);
    }
    return newGroup;
  };

  const joinGroup = async (inviteCode: string) => {
    const result = await apiJoinGroup(inviteCode);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    if (result.group?.id) {
      setSelectedGroupId(result.group.id);
    }
    return result;
  };

  const admitMember = async (userId: number) => {
    if (!currentGroup) return;
    const { admitMember: apiAdmitMember } = await import('../api/groups');
    await apiAdmitMember(currentGroup.id, userId);
    await queryClient.invalidateQueries({ queryKey: ['members', currentGroup.id] });
  };

  const cancelRequest = async () => {
    if (!currentGroup) return;
    const { cancelJoinRequest } = await import('../api/groups');
    await cancelJoinRequest(currentGroup.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
  };

  const isAdmin = currentGroup?.role === 'admin';

  const isLoading = isGroupsLoading || (isAuthenticated && !groupsData && !isError);

  return (
    <GroupContext.Provider
      value={{
        groups,
        currentGroup,
        selectedGroupId: currentGroup?.id ?? null,
        switchGroup,
        createGroup,
        joinGroup,
        admitMember,
        cancelRequest,
        isAdmin,
        isLoading,
        isError,
        error,
        refetch,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
