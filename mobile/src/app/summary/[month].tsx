import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme } from '@/utils/theme';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/context/GroupContext';
import { useSummaryQuery } from '@/hooks/useSummaryQuery';
import { SummaryTable } from '@/components/SummaryTable';
import {
  currentMonthStr,
  formatMonth,
  getPrevMonth,
  getNextMonth,
} from '@/utils/dateHelpers';

export default function SummaryScreen() {
  const colors = useAppTheme();
  const { user } = useAuth();
  const { currentGroup } = useGroup();
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string }>();

  // Active month state defaulting to route param or current month
  const [selectedMonth, setSelectedMonth] = useState<string>(
    params.month || currentMonthStr()
  );

  const groupId = currentGroup?.id;

  // Server-authoritative summary query
  const {
    data: summaryData,
    isLoading,
    isError,
    refetch,
  } = useSummaryQuery(groupId, selectedMonth, !!currentGroup);

  const members = summaryData?.members ?? [];
  const grandTotal = summaryData?.grandTotal ?? 0;

  // Sort members list so current user is always placed at the top
  const sortedMembers = useMemo(() => {
    if (!members.length) return [];
    return [...members].sort((a, b) => {
      if (a.member_id === user?.id) return -1;
      if (b.member_id === user?.id) return 1;
      return 0;
    });
  }, [members, user]);

  const handlePrevMonth = () => {
    const prev = getPrevMonth(selectedMonth);
    setSelectedMonth(prev);
  };

  const handleNextMonth = () => {
    const next = getNextMonth(selectedMonth);
    setSelectedMonth(next);
  };

  const handleResetMonth = () => {
    setSelectedMonth(currentMonthStr());
  };

  // No group selected state
  if (!currentGroup) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="bar-chart-outline" size={64} color={colors.textDim} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Group Selected</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Please select or join a group to view monthly summaries.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* Month Navigator */}
      <View style={[styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetMonth} style={styles.monthLabelContainer}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{formatMonth(selectedMonth)}</Text>
          <Text style={[styles.resetText, { color: colors.primary }]}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Grand Total Display */}
      <View style={[styles.grandTotalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.grandTotalLabel, { color: colors.textMuted }]}>Month Total</Text>
        <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
          ₹{grandTotal.toLocaleString()}
        </Text>
        <Text style={[styles.grandTotalSub, { color: colors.textMuted }]}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>
      </View>

      {/* Main Content: Table / Loading / Empty / Error */}
      {isLoading && members.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading summary...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to load summary</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sortedMembers.length > 0 ? (
        <View style={styles.tableWrapper}>
          <SummaryTable 
            members={sortedMembers} 
            grandTotal={grandTotal} 
            onMemberPress={(memberId) => router.push(`/summary/member/${memberId}/${selectedMonth}`)}
          />
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="bar-chart-outline" size={64} color={colors.textDim} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Summary Data</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            No meal entries recorded for {formatMonth(selectedMonth)}.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: THEME.spacing.lg, gap: THEME.spacing.lg },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
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
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: THEME.spacing.md },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
  },
  navBtn: { padding: THEME.spacing.sm },
  monthLabelContainer: { alignItems: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  resetText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  grandTotalCard: {
    alignItems: 'center',
    padding: THEME.spacing.xl,
    borderRadius: THEME.radius.xl,
    borderWidth: 1,
  },
  grandTotalLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  grandTotalValue: { fontSize: 32, fontWeight: '800', marginVertical: 4 },
  grandTotalSub: { fontSize: 13 },
  tableWrapper: { marginTop: THEME.spacing.sm },
});
