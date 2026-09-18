import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { groupsApi } from '../api/groups';

const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setGroups([]);
      setCurrentGroup(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await groupsApi.getGroups();
      setGroups(data);
      if (data.length > 0) {
        // If currentGroup is not set or not in the new list, pick the first one
        if (!currentGroup || !data.find(g => g.id === currentGroup.id)) {
          setCurrentGroup(data[0]);
        }
      } else {
        setCurrentGroup(null);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentGroup]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchMembers = useCallback(async () => {
    if (currentGroup) {
      try {
        const members = await groupsApi.getMembers(currentGroup.id);
        setAllMembers(members);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    } else {
      setAllMembers([]);
    }
  }, [currentGroup]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const membership = allMembers.find(m => m.user_id === user?.id);
  const isAdmin = membership?.role === 'admin';
  const activeMembers = allMembers.filter(m => m.is_active);

  const switchGroup = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) setCurrentGroup(group);
  };

  const createGroup = async (name, prices) => {
    const newGroup = await groupsApi.createGroup(name, prices);
    await fetchGroups();
    return newGroup;
  };

  const joinGroup = async (inviteCode) => {
    const data = await groupsApi.joinGroup(inviteCode);
    await fetchGroups();
    return data;
  };

  const admitMember = async (userId) => {
    if (!currentGroup) return;
    await groupsApi.admitMember(currentGroup.id, userId);
    await fetchMembers();
  };

  const cancelRequest = async () => {
    if (!currentGroup) return;
    await groupsApi.cancelJoinRequest(currentGroup.id);
    await fetchGroups(); // Fetches groups, currentGroup will be updated (likely null)
  };

  const isPending = currentGroup?.role === 'pending';

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
      refreshGroups: fetchGroups,
      refreshMembers: fetchMembers,
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
