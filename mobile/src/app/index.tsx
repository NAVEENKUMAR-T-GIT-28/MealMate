import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useAttendanceQuery } from '../hooks/useAttendanceQuery';
import { usePricesQuery } from '../hooks/usePricesQuery';
import { useMembersQuery } from '../hooks/useMembersQuery';
import { useToggleAttendanceMutation } from '../hooks/useToggleAttendanceMutation';
import { MemberRow, MealType } from '../components/MemberRow';

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DashboardScreen() {
  const colors = useAppTheme();
  const { user } = useAuth();
  const { groups, currentGroup, switchGroup, isLoading: isGroupLoading, isError: isGroupError, refetch: refetchGroups } = useGroup();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());

  // Fetch attendance for selected date
  const {
    data: attendanceData = [],
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    refetch: refetchAttendance,
  } = useAttendanceQuery(currentGroup?.id, selectedDate, !!currentGroup);

  // Fetch meal prices from http://localhost:5000/api/prices?group_id=:id
  const {
    data: pricesData = [],
    refetch: refetchPrices,
  } = usePricesQuery(currentGroup?.id);

  // Fetch group members for role information (admin vs member)
  const {
    data: membersData = [],
    refetch: refetchMembers,
  } = useMembersQuery(currentGroup?.id);

  const toggleMutation = useToggleAttendanceMutation(user?.id);

  // Sort member attendance records according to rules:
  // 1. Current logged in user
  // 2. Group Admin
  // 3. Alphabetical order for remaining members
  const sortedAttendanceData = useMemo(() => {
    if (!membersData || membersData.length === 0) return [];
    
    // Map membersData to include attendance info
    const list = membersData.map((member) => {
      const attendance = attendanceData.find((a) => a.user_id === member.user_id);
      return {
        user_id: member.user_id,
        member_name: member.name,
        role: member.role,
        morning: attendance ? !!attendance.morning : false,
        afternoon: attendance ? !!attendance.afternoon : false,
        night: attendance ? !!attendance.night : false,
      };
    });
    
    return list.sort((a, b) => {
      // Rule 1: Current user always at top
      if (user && a.user_id === user.id) return -1;
      if (user && b.user_id === user.id) return 1;

      // Rule 2: Admin comes next
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;

      // Rule 3: Alphabetical sort for remaining users
      const nameA = a.member_name || '';
      const nameB = b.member_name || '';
      return nameA.localeCompare(nameB);
    });
  }, [attendanceData, user, membersData]);

  // Calculate live counts across all group members for the selected date
  const liveCounts = useMemo(() => {
    const counts = { morning: 0, afternoon: 0, night: 0 };
    for (const record of attendanceData) {
      if (record.morning) counts.morning++;
      if (record.afternoon) counts.afternoon++;
      if (record.night) counts.night++;
    }
    return counts;
  }, [attendanceData]);

  // Compute live total for the current user based on prices API
  const liveTotal = useMemo(() => {
    if (!pricesData || !attendanceData || !user) return 0;
    const dateObj = new Date(selectedDate);
    const currentPrices: Record<string, number> = { morning: 0, afternoon: 0, night: 0 };

    for (const p of pricesData) {
      const effDate = new Date(p.effective_from);
      if (effDate <= dateObj) {
        if (!currentPrices[p.meal_type]) {
          currentPrices[p.meal_type] = Number(p.price) || 0;
        }
      }
    }
    if (!currentPrices.morning) currentPrices.morning = 15;
    if (!currentPrices.afternoon) currentPrices.afternoon = 15;
    if (!currentPrices.night) currentPrices.night = 20;

    const myEntry = attendanceData.find((record) => record.user_id === user.id);
    let total = 0;
    if (myEntry) {
      if (myEntry.morning) total += currentPrices.morning;
      if (myEntry.afternoon) total += currentPrices.afternoon;
      if (myEntry.night) total += currentPrices.night;
    }
    return total;
  }, [pricesData, attendanceData, selectedDate, user]);

  const handleMemberToggle = useCallback((memberId: number, meal: MealType) => {
    if (!currentGroup || toggleMutation.isPending) return;
    if (user?.id !== memberId) return; // Only allow user to toggle own attendance

    toggleMutation.mutate({
      group_id: currentGroup.id,
      date: selectedDate,
      meal_type: meal,
    });
  }, [currentGroup, selectedDate, toggleMutation, user?.id]);

  const isRefreshing = isGroupLoading || isAttendanceLoading;

  const onRefresh = () => {
    refetchGroups();
    refetchPrices();
    refetchMembers();
    if (currentGroup) refetchAttendance();
  };

  // Loading state
  if (isGroupLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading dashboard...</Text>
      </View>
    );
  }

  // Error state
  if (isGroupError) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to load groups</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetchGroups()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state: No groups
  if (!currentGroup || groups.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.centerContainer, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Ionicons name="people-outline" size={64} color={colors.textDim} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Groups Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          You are not a member of any group yet. Join or create a group to start tracking meals.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* Top Header Row with Group Name */}
      <View style={styles.topHeader}>
        <View style={styles.groupHeaderTitle}>
          <Text style={[styles.groupTitleText, { color: colors.text }]}>{currentGroup.name}</Text>
        </View>
      </View>

      {/* Date Navigator */}
      <View style={[styles.dateNavContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate(d => addDaysStr(d, -1))}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavCenter}
          onPress={() => setSelectedDate(getTodayStr())}
        >
          <Text style={[styles.dateNavText, { color: colors.text }]}>
            {formatDateDisplay(selectedDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate(d => addDaysStr(d, 1))}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Top Metric Grid Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#F59E0B' }]}>
          <Text style={styles.statEmoji}>☀️</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{liveCounts.morning}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#FB923C' }]}>
          <Text style={styles.statEmoji}>🌤️</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{liveCounts.afternoon}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: '#6366F1' }]}>
          <Text style={styles.statEmoji}>🌙</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{liveCounts.night}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>₹{liveTotal}</Text>
        </View>
      </View>

      {/* Roster / Members Attendance Cards */}
      <View style={styles.rosterSection}>
        {isAttendanceLoading && attendanceData.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : isAttendanceError ? (
          <View style={styles.errorBox}>
            <Text style={{ color: colors.danger, marginBottom: 8 }}>Failed to load attendance records.</Text>
            <TouchableOpacity onPress={() => refetchAttendance()}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : sortedAttendanceData.length === 0 ? (
          <View style={styles.emptyRoster}>
            <Text style={{ color: colors.textMuted }}>No members found in this group.</Text>
          </View>
        ) : (
          sortedAttendanceData.map((record, index) => (
            <MemberRow
              key={record.user_id}
              memberId={record.user_id}
              name={record.member_name || `User ${record.user_id}`}
              meals={{
                morning: !!record.morning,
                afternoon: !!record.afternoon,
                night: !!record.night,
              }}
              onToggle={handleMemberToggle}
              disabled={record.user_id !== user?.id}
              index={index}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: THEME.spacing.lg, gap: THEME.spacing.md },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  loadingText: { marginTop: THEME.spacing.md, fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: THEME.spacing.md },
  retryBtn: {
    marginTop: THEME.spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: THEME.spacing.lg },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    lineHeight: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupHeaderTitle: {
    flex: 1,
  },
  groupTitleText: {
    fontSize: 22,
    fontWeight: '800',
  },
  userBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    marginVertical: 4,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavCenter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateNavText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  statCard: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: THEME.radius.md,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  rosterSection: {
    marginTop: 4,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
  },
  emptyRoster: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
});
