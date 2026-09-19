import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme } from '@/utils/theme';
import { useGroup } from '@/context/GroupContext';
import { getMonthlySummary } from '@/api/summary';
import { queryKeys } from '@/query/queryKeys';
import { formatMonth, formatMonthShort } from '@/utils/dateHelpers';

export default function HistoryScreen() {
  const colors = useAppTheme();
  const router = useRouter();
  const { currentGroup } = useGroup();

  const monthsToFetch = useMemo(() => {
    if (!currentGroup) return [];
    const current = new Date();
    const createdDate = currentGroup.created_at ? new Date(currentGroup.created_at) : current;
    
    const months = [];
    let d = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1);

    let maxMonths = 24;
    while (d >= end && maxMonths > 0) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
      d.setMonth(d.getMonth() - 1);
      maxMonths--;
    }
    return months;
  }, [currentGroup]);

  const groupId = currentGroup?.id;

  const summaryQueries = useQueries({
    queries: monthsToFetch.map(month => ({
      queryKey: queryKeys.summary(groupId ?? 0, month),
      queryFn: () => getMonthlySummary(groupId!, month),
      staleTime: 5 * 60 * 1000,
      enabled: !!groupId,
    })),
  });

  const loading = summaryQueries.some(q => q.isLoading);

  const monthsData = useMemo(() => {
    return summaryQueries
      .map((q, idx) => {
        if (!q.data) return null;
        const data = q.data;
        const totalEntryCount = data.members.reduce((sum: number, member: any) => {
          return sum + (member.morning_count ?? member.total_morning ?? 0) + (member.afternoon_count ?? member.total_afternoon ?? 0) + (member.night_count ?? member.total_night ?? 0);
        }, 0);
        return { month: monthsToFetch[idx], totalSpent: data.grandTotal, entryCount: totalEntryCount };
      })
      .filter(Boolean) as { month: string; totalSpent: number; entryCount: number }[];
  }, [summaryQueries, monthsToFetch]);

  const years = useMemo(() => {
    const map = new Map<string, typeof monthsData>();
    for (const m of monthsData) {
      const year = m.month.substring(0, 4);
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(m);
    }
    const list = [];
    for (const [year, months] of map) {
      list.push({
        year,
        totalSpent: months.reduce((s, m) => s + m.totalSpent, 0),
        monthCount: months.length,
        months,
      });
    }
    list.sort((a, b) => b.year.localeCompare(a.year));
    return list;
  }, [monthsData]);

  const [expandedYears, setExpandedYears] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (expandedYears === null && years.length > 0) {
      setExpandedYears(new Set([years[0].year]));
    }
  }, [years, expandedYears]);

  const maxSpend = useMemo(() => {
    let max = 0;
    for (const y of years) {
      for (const m of y.months) {
        if (m.totalSpent > max) max = m.totalSpent;
      }
    }
    return max || 1;
  }, [years]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev || []);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  };

  if (!currentGroup) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="calendar-outline" size={64} color={colors.textDim} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Group Selected</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Please select or join a group to view history.
        </Text>
      </View>
    );
  }

  if (loading && monthsData.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading history...</Text>
      </View>
    );
  }

  if (years.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 64 }}>📅</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No History</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Start marking meals on the Today tab to build history
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {years.map((yearData, yi) => {
        const expanded = expandedYears ? expandedYears.has(yearData.year) : false;
        
        return (
          <View key={yearData.year} style={[styles.yearCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.yearHeader, expanded && { borderBottomWidth: 1, borderBottomColor: colors.border }]} 
              onPress={() => toggleYear(yearData.year)}
            >
              <View style={styles.yearLeft}>
                <View style={[styles.yearIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="calendar" size={22} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.yearTitle, { color: colors.text }]}>{yearData.year}</Text>
                  <Text style={[styles.yearMeta, { color: colors.textMuted }]}>
                    {yearData.monthCount} month{yearData.monthCount !== 1 ? 's' : ''} recorded
                  </Text>
                </View>
              </View>
              <View style={styles.yearRight}>
                <Text style={[styles.yearTotal, { color: colors.primary }]}>₹{yearData.totalSpent.toLocaleString()}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            {expanded && (
              <View style={styles.expandedContent}>
                {/* Spending Bars */}
                <View style={styles.spendingSection}>
                  <Text style={[styles.spendingLabel, { color: colors.textMuted }]}>Month-wise Spending</Text>
                  {yearData.months.map(m => {
                    const ratio = m.totalSpent / maxSpend;
                    return (
                      <View key={m.month} style={styles.barRow}>
                        <Text style={[styles.barLabel, { color: colors.text }]}>{formatMonthShort(m.month)}</Text>
                        <View style={styles.barTrack}>
                          <View 
                            style={[
                              styles.barFill, 
                              { backgroundColor: colors.primary, width: `${Math.max(ratio * 100, 2)}%` }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.barValue, { color: colors.text }]}>₹{m.totalSpent.toLocaleString()}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Month Cards */}
                <View style={styles.monthCardsList}>
                  {yearData.months.map(m => (
                    <TouchableOpacity
                      key={m.month}
                      style={[styles.monthCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => router.push(`/summary/${m.month}`)}
                    >
                      <View style={styles.monthLeft}>
                        <View style={[styles.monthDot, { backgroundColor: colors.primary }]} />
                        <View>
                          <Text style={[styles.monthName, { color: colors.text }]}>{formatMonth(m.month)}</Text>
                          <Text style={[styles.monthEntries, { color: colors.textMuted }]}>{m.entryCount} meal entries</Text>
                        </View>
                      </View>
                      <View style={styles.monthRight}>
                        <Text style={[styles.monthTotal, { color: colors.primary }]}>₹{m.totalSpent.toLocaleString()}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: THEME.spacing.lg, gap: THEME.spacing.lg, paddingBottom: THEME.spacing.xl * 2 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  loadingText: { marginTop: THEME.spacing.md, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: THEME.spacing.md },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, lineHeight: 20, paddingHorizontal: 32 },
  
  yearCard: { borderRadius: THEME.radius.lg, borderWidth: 1, overflow: 'hidden' },
  yearHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: THEME.spacing.lg },
  yearLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yearIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  yearTitle: { fontSize: 18, fontWeight: '700' },
  yearMeta: { fontSize: 13, marginTop: 2 },
  yearRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearTotal: { fontSize: 16, fontWeight: '700' },
  
  expandedContent: { padding: THEME.spacing.lg, gap: THEME.spacing.xl },
  spendingSection: { gap: THEME.spacing.sm },
  spendingLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barLabel: { width: 40, fontSize: 13, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 55, textAlign: 'right', fontSize: 13, fontWeight: '600' },
  
  monthCardsList: { gap: THEME.spacing.md },
  monthCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: THEME.spacing.md, borderRadius: THEME.radius.md, borderWidth: 1 },
  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthDot: { width: 10, height: 10, borderRadius: 5 },
  monthName: { fontSize: 15, fontWeight: '600' },
  monthEntries: { fontSize: 12, marginTop: 2 },
  monthRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTotal: { fontSize: 15, fontWeight: '700' },
});
