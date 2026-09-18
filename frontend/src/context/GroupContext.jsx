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

  const createGroup = async (name) => {
    const newGroup = await groupsApi.createGroup(name);
    await fetchGroups();
    setCurrentGroup(newGroup);
    return newGroup;
  };

  const joinGroup = async (inviteCode) => {
    const data = await groupsApi.joinGroup(inviteCode);
    await fetchGroups();
    setCurrentGroup(data.group);
    return data;
  };

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
      refreshGroups: fetchGroups,
      refreshMembers: fetchMembers,
      loading
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
