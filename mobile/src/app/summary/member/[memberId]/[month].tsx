import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, getDaysInMonth } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme } from '@/utils/theme';
import { useGroup } from '@/context/GroupContext';
import { useSummaryQuery } from '@/hooks/useSummaryQuery';
import { useAttendanceMonthQuery } from '@/hooks/useAttendanceQuery';
import { formatMonth, getPrevMonth, getNextMonth, currentMonthStr } from '@/utils/dateHelpers';

export default function MemberDetailScreen() {
  const colors = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ memberId: string; month: string }>();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(
    params.month || currentMonthStr()
  );

  const { currentGroup } = useGroup();
  const groupId = currentGroup?.id;

  const {
    data: summaryData,
    isLoading: summaryLoading,
  } = useSummaryQuery(groupId, selectedMonth, !!currentGroup);

  const {
    data: monthAttendance = [],
    isLoading: attendanceLoading,
  } = useAttendanceMonthQuery(groupId, selectedMonth, params.memberId);

  const isLoading = summaryLoading || attendanceLoading;

  const memberSummary = useMemo(() => {
    if (!summaryData) return null;
    return summaryData.members.find((m: any) => String(m.member_id) === params.memberId || String(m.user_id) === params.memberId) || {
      morning_count: 0, afternoon_count: 0, night_count: 0,
      total_morning: 0, total_afternoon: 0, total_night: 0,
      total_cost: 0
    };
  }, [summaryData, params.memberId]);

  if (!isLoading && (!summaryData || !summaryData.members.find((m: any) => String(m.member_id) === params.memberId || String(m.user_id) === params.memberId))) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48 }}>🤔</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Member Not Found</Text>
        <TouchableOpacity style={[styles.backBtnLarge, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnLargeText}>Back to Summary</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Generate calendar days for the month
  const monthDays = useMemo(() => {
    const [year, m] = selectedMonth.split('-');
    const daysInMonth = getDaysInMonth(new Date(Number(year), Number(m) - 1));
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return `${selectedMonth}-${day}`;
    });
  }, [selectedMonth]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{(memberSummary as any)?.name || (memberSummary as any)?.full_name || (memberSummary as any)?.member_name || 'Member'}</Text>
          {(memberSummary as any)?.role && (
            <View style={[styles.roleBadge, { borderColor: colors.primary }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>{(memberSummary as any).role.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Month Navigator */}
      <View style={[styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setSelectedMonth(getPrevMonth(selectedMonth))}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedMonth(currentMonthStr())} style={styles.monthLabelContainer}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{formatMonth(selectedMonth)}</Text>
          <Text style={[styles.resetText, { color: colors.primary }]}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={() => setSelectedMonth(getNextMonth(selectedMonth))}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && !memberSummary ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading details...</Text>
        </View>
      ) : (
        <>


          {/* Calendar Table */}
          <View style={[styles.calendarTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.calendarHeader, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderBottomColor: colors.border }]}>
              <Text style={[styles.calHeadText, styles.colDate, { color: colors.text }]}>Date</Text>
              <Text style={[styles.calHeadText, styles.colMeal, { color: colors.morning || '#F59E0B' }]}>☀️ M</Text>
              <Text style={[styles.calHeadText, styles.colMeal, { color: colors.afternoon || '#F97316' }]}>🌤️ A</Text>
              <Text style={[styles.calHeadText, styles.colMeal, { color: colors.night || '#6366F1' }]}>🌙 N</Text>
            </View>

            {monthDays.map((dateStr, idx) => {
              const dayData = monthAttendance.find((a: any) => a.date === dateStr);
              const d = new Date(dateStr);
              const isFuture = d > new Date();

              return (
                <View 
                  key={dateStr} 
                  style={[
                    styles.calendarRow, 
                    { borderBottomColor: colors.border },
                    idx === monthDays.length - 1 && { borderBottomWidth: 0 },
                    isFuture && { opacity: 0.5 }
                  ]}
                >
                  <View style={[styles.colDate, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={[styles.calRowText, { color: colors.text }]}>{format(d, 'dd/MM/yyyy')}  </Text>
                    <Text style={[styles.calRowDay, { color: colors.textMuted }]}>{format(d, 'EEE').toUpperCase()}</Text>
                  </View>
                  
                  <View style={styles.colMeal}>
                    {dayData?.morning ? <View style={[styles.dot, { backgroundColor: colors.morning || '#F59E0B' }]} /> : <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: '600' }}>-</Text>}
                  </View>
                  <View style={styles.colMeal}>
                    {dayData?.afternoon ? <View style={[styles.dot, { backgroundColor: colors.afternoon || '#F97316' }]} /> : <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: '600' }}>-</Text>}
                  </View>
                  <View style={styles.colMeal}>
                    {dayData?.night ? <View style={[styles.dot, { backgroundColor: colors.night || '#6366F1' }]} /> : <Text style={{ color: colors.textMuted, fontSize: 18, fontWeight: '600' }}>-</Text>}
                  </View>
                </View>
              );
            })}
          </View>
          
          <View style={{ marginTop: THEME.spacing.xl, borderRadius: THEME.radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', padding: THEME.spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontWeight: '700', color: colors.text }}>☀️ Morning</Text>
              <Text style={{ width: 60, textAlign: 'center', color: colors.text }}>{(memberSummary as any)?.morning_count ?? (memberSummary as any)?.total_morning ?? 0}</Text>
              <Text style={{ width: 80, textAlign: 'right', fontWeight: '700', color: colors.text }}>₹{(memberSummary as any)?.morning_cost ?? 0}</Text>
            </View>
            <View style={{ flexDirection: 'row', padding: THEME.spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontWeight: '700', color: colors.text }}>🌤️ Afternoon</Text>
              <Text style={{ width: 60, textAlign: 'center', color: colors.text }}>{(memberSummary as any)?.afternoon_count ?? (memberSummary as any)?.total_afternoon ?? 0}</Text>
              <Text style={{ width: 80, textAlign: 'right', fontWeight: '700', color: colors.text }}>₹{(memberSummary as any)?.afternoon_cost ?? 0}</Text>
            </View>
            <View style={{ flexDirection: 'row', padding: THEME.spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontWeight: '700', color: colors.text }}>🌙 Night</Text>
              <Text style={{ width: 60, textAlign: 'center', color: colors.text }}>{(memberSummary as any)?.night_count ?? (memberSummary as any)?.total_night ?? 0}</Text>
              <Text style={{ width: 80, textAlign: 'right', fontWeight: '700', color: colors.text }}>₹{(memberSummary as any)?.night_cost ?? 0}</Text>
            </View>
            <View style={{ flexDirection: 'row', padding: THEME.spacing.md, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
              <Text style={{ flex: 1, fontWeight: '800', fontSize: 16, textTransform: 'uppercase', color: colors.primary }}>This Month</Text>
              <Text style={{ width: 100, textAlign: 'right', fontWeight: '800', fontSize: 18, color: colors.primary }}>₹{(memberSummary?.total_cost || 0).toLocaleString()}</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: THEME.spacing.lg, gap: THEME.spacing.lg, paddingBottom: THEME.spacing.xl * 2 },
  centerContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 48, flex: 1 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: THEME.spacing.md },
  backBtnLarge: { marginTop: THEME.spacing.lg, paddingHorizontal: 24, paddingVertical: 12, borderRadius: THEME.radius.md },
  backBtnLargeText: { color: '#FFF', fontWeight: '600' },
  loadingText: { marginTop: THEME.spacing.md, fontSize: 14 },
  
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
  },
  backBtn: { marginRight: THEME.spacing.md },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: THEME.radius.full, borderWidth: 1 },
  roleText: { fontSize: 10, fontWeight: '700' },

  navCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: THEME.spacing.md, borderRadius: THEME.radius.lg, borderWidth: 1 },
  navBtn: { padding: THEME.spacing.sm },
  monthLabelContainer: { alignItems: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  resetText: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: THEME.spacing.sm },
  statCard: { flex: 1, minWidth: '45%', padding: THEME.spacing.md, borderRadius: THEME.radius.lg, borderWidth: 1, alignItems: 'center' },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  statTotalValue: { fontSize: 22, fontWeight: '800' },

  calendarTable: { borderRadius: THEME.radius.lg, borderWidth: 1, overflow: 'hidden' },
  calendarHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 12, paddingHorizontal: THEME.spacing.md },
  calHeadText: { fontWeight: '700', fontSize: 13 },
  calendarRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 12, paddingHorizontal: THEME.spacing.md, alignItems: 'center' },
  calRowText: { fontSize: 14, fontWeight: '500' },
  calRowDay: { fontSize: 12 },
  colDate: { flex: 1 },
  colMeal: { width: 48, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
