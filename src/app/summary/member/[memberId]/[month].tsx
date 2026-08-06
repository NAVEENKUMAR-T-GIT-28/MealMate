import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import { formatMonth } from '@/utils/dateHelpers';
import { format, parseISO } from 'date-fns';
import {
  getMemberMonthlyDetails,
  type MemberMonthlyDetailsData,
  type DayDetail,
} from '@/db/memberMonthlyDetails.service';

// ─── Helpers ──────────────────────────────────────────────
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function formatDayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

// ─── Avatar colours (rotating palette) ───────────────────
const AVATAR_COLORS = [
  '#10B981', '#6366F1', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Screen ──────────────────────────────────────────────
export default function MemberMonthlyDetailsScreen() {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { memberId, month: paramMonth } = useLocalSearchParams<{
    memberId: string;
    month: string;
  }>();
  const router = useRouter();

  const [month, setMonth] = useState(paramMonth ?? '');
  const [data, setData] = useState<MemberMonthlyDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const result = await getMemberMonthlyDetails(Number(memberId), month);
      setData(result);
    } catch (e) {
      console.error('Failed to load member details:', e);
    } finally {
      setLoading(false);
    }
  }, [memberId, month]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ─── Month navigation ──────────────────────────────────
  const goToPrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    setMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    setMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  // ─── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="person-outline" size={64} color={colors.textDim} />
        <Text style={styles.emptyTitle}>Member Not Found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const bgColor = avatarColor(data.member.name);

  return (
    <View style={styles.container}>
      {/* ────── HEADER ────── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>

          <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{getInitial(data.member.name)}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {data.member.name}
            </Text>
            <Text style={styles.headerMonth}>{formatMonth(month)}</Text>
          </View>
        </View>

        <Pressable onPress={() => {}} style={styles.changeMonthBtn}>
          <View style={styles.changeMonthRow}>
            <View style={styles.monthNavBtns}>
              <Pressable onPress={goToPrevMonth} hitSlop={8} style={styles.monthArrow}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={goToNextMonth} hitSlop={8} style={styles.monthArrow}>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* ────── SCROLLABLE CONTENT ────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ────── SUMMARY CARDS ────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.cardsGrid}>
          {/* Morning */}
          <View style={[styles.statCard, { borderColor: colors.morningBg }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.morningBg }]}>
              <Text style={styles.statEmoji}>☀️</Text>
            </View>
            <Text style={[styles.statCount, { color: colors.morning }]}>
              {data.morningCount}
            </Text>
            <Text style={styles.statLabel}>Morning</Text>
            <Text style={[styles.statAmount, { color: colors.morning }]}>
              ₹{data.morningTotal.toLocaleString()}
            </Text>
          </View>

          {/* Afternoon */}
          <View style={[styles.statCard, { borderColor: colors.afternoonBg }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.afternoonBg }]}>
              <Text style={styles.statEmoji}>🌤️</Text>
            </View>
            <Text style={[styles.statCount, { color: colors.afternoon }]}>
              {data.afternoonCount}
            </Text>
            <Text style={styles.statLabel}>Afternoon</Text>
            <Text style={[styles.statAmount, { color: colors.afternoon }]}>
              ₹{data.afternoonTotal.toLocaleString()}
            </Text>
          </View>

          {/* Night */}
          <View style={[styles.statCard, { borderColor: colors.nightBg }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.nightBg }]}>
              <Text style={styles.statEmoji}>🌙</Text>
            </View>
            <Text style={[styles.statCount, { color: colors.night }]}>
              {data.nightCount}
            </Text>
            <Text style={styles.statLabel}>Night</Text>
            <Text style={[styles.statAmount, { color: colors.night }]}>
              ₹{data.nightTotal.toLocaleString()}
            </Text>
          </View>

          {/* Grand Total */}
          <View style={[styles.statCard, styles.totalCard]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ₹{data.grandTotal.toLocaleString()}
            </Text>
          </View>
        </Animated.View>

        {/* ────── DAILY TABLE ────── */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.tableWrapper}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.thCell, styles.mealCol, { color: colors.morning }]}>
              ☀️ Morning{'\n'}
              <Text style={styles.priceHint}>(₹{data.prices.morning})</Text>
            </Text>
            <Text style={[styles.thCell, styles.mealCol, { color: colors.afternoon }]}>
              🌤️ Afternoon{'\n'}
              <Text style={styles.priceHint}>(₹{data.prices.afternoon})</Text>
            </Text>
            <Text style={[styles.thCell, styles.mealCol, { color: colors.night }]}>
              🌙 Night{'\n'}
              <Text style={styles.priceHint}>(₹{data.prices.night})</Text>
            </Text>
            <Text style={[styles.thCell, styles.totalCol, { color: colors.primary }]}>
              Total (₹)
            </Text>
          </View>

          {/* Table rows */}
          {data.days.map((day, idx) => (
            <DayRow key={day.date} day={day} isEven={idx % 2 === 0} styles={styles} colors={colors} />
          ))}
        </Animated.View>

        {/* ────── BOTTOM MONTHLY TOTAL ────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.bottomCard}>
          <View style={styles.bottomLeft}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={{ fontSize: 18, color: colors.primary }}>₹</Text>
            </View>
            <View>
              <Text style={styles.bottomLabel}>Monthly Total</Text>
              <Text style={styles.bottomSub}>
                (Up to {data.days.length > 0 ? format(parseISO(data.days[data.days.length - 1].date), 'dd MMM yyyy') : '—'})
              </Text>
            </View>
          </View>
          <Text style={styles.bottomAmount}>
            ₹{data.grandTotal.toLocaleString()}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Day Row Component ───────────────────────────────────
function DayRow({ day, isEven, styles, colors }: { day: DayDetail; isEven: boolean; styles: any; colors: ThemeColors }) {
  return (
    <View style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}>
      <Text style={[styles.tdCell, styles.dateCol, styles.dateText]}>
        {formatDayDate(day.date)}
      </Text>
      <View style={[styles.mealCol, styles.mealCell]}>
        <MealIcon ate={day.morning} styles={styles} colors={colors} />
      </View>
      <View style={[styles.mealCol, styles.mealCell]}>
        <MealIcon ate={day.afternoon} styles={styles} colors={colors} />
      </View>
      <View style={[styles.mealCol, styles.mealCell]}>
        <MealIcon ate={day.night} styles={styles} colors={colors} />
      </View>
      <Text style={[styles.tdCell, styles.totalCol, styles.dayTotalText]}>
        ₹{day.dayTotal}
      </Text>
    </View>
  );
}

// ─── Meal Attendance Icon ────────────────────────────────
function MealIcon({ ate, styles, colors }: { ate: boolean; styles: any; colors: ThemeColors }) {
  return (
    <View
      style={[
        styles.mealIconCircle,
        { backgroundColor: ate ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.15)' },
      ]}
    >
      <Ionicons
        name={ate ? 'checkmark' : 'close'}
        size={16}
        color={ate ? colors.primary : colors.danger}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: colors.card,
    borderRadius: THEME.radius.full,
  },
  backBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Header ─────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 54,
    paddingBottom: THEME.spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    flex: 1,
  },
  headerBackBtn: {
    padding: THEME.spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerMonth: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  changeMonthBtn: {
    marginLeft: THEME.spacing.sm,
  },
  changeMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  monthNavBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xs,
    gap: THEME.spacing.sm,
  },
  monthArrow: {
    padding: THEME.spacing.xs,
  },

  // ─── Scroll ─────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl + 40,
  },

  // ─── Summary Cards ──────────────────────────────────
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: THEME.spacing.xs,
  },
  totalCard: {
    borderColor: colors.primary,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
  },
  statEmoji: {
    fontSize: 18,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: THEME.spacing.xs,
  },
  totalAmount: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },

  // ─── Table ──────────────────────────────────────────
  tableWrapper: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: THEME.spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thCell: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  priceHint: {
    fontWeight: '400',
    fontSize: 10,
    color: colors.textDim,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowEven: {
    backgroundColor: colors.card,
  },
  rowOdd: {
    backgroundColor: colors.background, // Used background instead of hardcoded dark
  },
  tdCell: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dateCol: {
    width: '22%',
    paddingLeft: THEME.spacing.md,
    textAlign: 'left',
  },
  mealCol: {
    width: '18%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCell: {
    flexDirection: 'row',
  },
  totalCol: {
    width: '24%',
    paddingRight: THEME.spacing.md,
    textAlign: 'right',
  },
  dateText: {
    fontWeight: '500',
    fontSize: 12,
    color: colors.textMuted,
  },
  dayTotalText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  mealIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Bottom Card ────────────────────────────────────
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xxl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  bottomLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSub: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  bottomAmount: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
});
