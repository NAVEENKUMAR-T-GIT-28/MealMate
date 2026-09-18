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
import { SummaryTable } from '@/components/SummaryTable';
import {
  getMonthlySummary,
  type MonthSummary,
} from '@/db/summary.repo';
import { getCurrentPrices, type CurrentPrices } from '@/db/prices.repo';
import { currentMonthStr, formatMonth } from '@/utils/dateHelpers';

export default function SummaryScreen() {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string }>();
  const [month, setMonth] = useState(params.month || currentMonthStr());
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [prices, setPrices] = useState<CurrentPrices | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        getMonthlySummary(month),
        getCurrentPrices(),
      ]);
      setSummary(s);
      setPrices(p);
    } catch (e) {
      console.error('Failed to load summary:', e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month Navigator */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.monthNav}>
        <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.monthText}>{formatMonth(month)}</Text>
        <Pressable onPress={goToNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* Price Info */}
      {prices && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.priceRow}>
          <View style={[styles.priceChip, { backgroundColor: colors.morningBg }]}>
            <Text style={[styles.priceText, { color: colors.morning }]}>
              ☀️ ₹{prices.morning}
            </Text>
          </View>
          <View style={[styles.priceChip, { backgroundColor: colors.afternoonBg }]}>
            <Text style={[styles.priceText, { color: colors.afternoon }]}>
              🌤️ ₹{prices.afternoon}
            </Text>
          </View>
          <View style={[styles.priceChip, { backgroundColor: colors.nightBg }]}>
            <Text style={[styles.priceText, { color: colors.night }]}>
              🌙 ₹{prices.night}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Grand Total Card */}
      {summary && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.grandTotalCard}>
          <Text style={styles.grandTotalLabel}>Month Total</Text>
          <Text style={styles.grandTotalValue}>₹{summary.grandTotal.toLocaleString()}</Text>
          <Text style={styles.grandTotalSub}>
            {summary.members.length} member{summary.members.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>
      )}

      {/* Summary Table */}
      {summary && summary.members.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(300)} style={styles.tableContainer}>
          <SummaryTable
            members={summary.members}
            grandTotal={summary.grandTotal}
            onMemberPress={(memberId) =>
              router.push(`/summary/member/${memberId}/${month}` as any)
            }
          />
        </Animated.View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color={colors.textDim} />
          <Text style={styles.emptyTitle}>No Data</Text>
          <Text style={styles.emptySubtitle}>
            No meal entries recorded for {formatMonth(month)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  navBtn: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.radius.full,
    backgroundColor: colors.card,
  },
  monthText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
    justifyContent: 'center',
  },
  priceChip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.full,
  },
  priceText: {
    fontWeight: '600',
    fontSize: 13,
  },
  grandTotalCard: {
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xxl,
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  grandTotalLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: THEME.spacing.xs,
  },
  grandTotalValue: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '700',
  },
  grandTotalSub: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: THEME.spacing.xs,
  },
  tableContainer: {
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: THEME.spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
