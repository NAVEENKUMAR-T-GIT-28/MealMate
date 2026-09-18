import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import { getMonthsWithTotals } from '@/db/summary.repo';
import { formatMonth } from '@/utils/dateHelpers';
import { format, parseISO } from 'date-fns';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MonthData {
  month: string;       // 'YYYY-MM'
  entryCount: number;
  totalSpent: number;
}

interface YearData {
  year: string;
  totalSpent: number;
  monthCount: number;
  months: MonthData[];
}

export default function HistoryScreen() {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [years, setYears] = useState<YearData[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const monthsData = await getMonthsWithTotals();

          // Group months by year
          const yearMap = new Map<string, MonthData[]>();
          for (const m of monthsData) {
            const year = m.month.substring(0, 4);
            if (!yearMap.has(year)) yearMap.set(year, []);
            yearMap.get(year)!.push(m);
          }

          // Build year data sorted descending
          const yearList: YearData[] = [];
          for (const [year, months] of yearMap) {
            yearList.push({
              year,
              totalSpent: months.reduce((sum, m) => sum + m.totalSpent, 0),
              monthCount: months.length,
              months, // already sorted desc from repo
            });
          }
          yearList.sort((a, b) => b.year.localeCompare(a.year));

          setYears(yearList);

          // Auto-expand the most recent year
          if (yearList.length > 0) {
            setExpandedYears(new Set([yearList[0].year]));
          }
        } catch (e) {
          console.error('Failed to load history:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const toggleYear = (year: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  // Find the max monthly spend for the proportional bars
  const maxMonthlySpend = useMemo(() => {
    let max = 0;
    for (const y of years) {
      for (const m of y.months) {
        if (m.totalSpent > max) max = m.totalSpent;
      }
    }
    return max || 1;
  }, [years]);

  const getShortMonth = (monthStr: string) => {
    try {
      return format(parseISO(`${monthStr}-01`), 'MMM');
    } catch {
      return monthStr;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {years.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.textDim} />
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptySubtitle}>
            Start marking meals on the Today tab to build history
          </Text>
        </View>
      ) : (
        years.map((yearData, yearIndex) => {
          const isExpanded = expandedYears.has(yearData.year);

          return (
            <Animated.View
              key={yearData.year}
              entering={FadeInDown.delay(yearIndex * 100).springify()}
            >
              {/* Year Summary Card */}
              <Pressable
                onPress={() => toggleYear(yearData.year)}
                style={[styles.yearCard, isExpanded && styles.yearCardExpanded]}
              >
                <View style={styles.yearLeft}>
                  <View style={styles.yearIconWrap}>
                    <Ionicons name="calendar" size={22} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.yearTitle}>{yearData.year}</Text>
                    <Text style={styles.yearMeta}>
                      {yearData.monthCount} month{yearData.monthCount !== 1 ? 's' : ''} recorded
                    </Text>
                  </View>
                </View>
                <View style={styles.yearRight}>
                  <Text style={styles.yearTotal}>₹{yearData.totalSpent.toLocaleString()}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textDim}
                  />
                </View>
              </Pressable>

              {/* Expanded: Month Cards + Spending Vis */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Spending Visualization */}
                  <View style={styles.spendingSection}>
                    <Text style={styles.sectionLabel}>Month-wise Spending</Text>
                    {yearData.months.map((m) => {
                      const ratio = m.totalSpent / maxMonthlySpend;
                      return (
                        <View key={m.month} style={styles.barRow}>
                          <Text style={styles.barLabel}>
                            {getShortMonth(m.month)}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: `${Math.max(ratio * 100, 2)}%`,
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.barValue}>
                            ₹{m.totalSpent.toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Month Cards */}
                  {yearData.months.map((m, mIndex) => (
                    <Pressable
                      key={m.month}
                      onPress={() => router.push(`/summary/${m.month}`)}
                      style={styles.monthCard}
                    >
                      <View style={styles.monthLeft}>
                        <View style={styles.monthDot} />
                        <View>
                          <Text style={styles.monthName}>{formatMonth(m.month)}</Text>
                          <Text style={styles.monthEntries}>
                            {m.entryCount} meal entries
                          </Text>
                        </View>
                      </View>
                      <View style={styles.monthRight}>
                        <Text style={styles.monthTotal}>
                          ₹{m.totalSpent.toLocaleString()}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textDim}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: THEME.spacing.lg,
      paddingBottom: THEME.spacing.xxxl + 40,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Year Card
    yearCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: THEME.radius.lg,
      padding: THEME.spacing.lg,
      marginBottom: THEME.spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    yearCardExpanded: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      marginBottom: 0,
      borderBottomWidth: 0,
    },
    yearLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: THEME.spacing.md,
    },
    yearIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}1A`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yearTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    yearMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    yearRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    yearTotal: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },

    // Expanded Content
    expandedContent: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: colors.border,
      borderBottomLeftRadius: THEME.radius.lg,
      borderBottomRightRadius: THEME.radius.lg,
      paddingHorizontal: THEME.spacing.lg,
      paddingBottom: THEME.spacing.lg,
      marginBottom: THEME.spacing.md,
    },

    // Spending Visualization
    spendingSection: {
      paddingVertical: THEME.spacing.md,
      marginBottom: THEME.spacing.sm,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: THEME.spacing.md,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: THEME.spacing.xs + 2,
      gap: THEME.spacing.sm,
    },
    barLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '500',
      width: 30,
    },
    barTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: `${colors.primary}15`,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
      opacity: 0.85,
    },
    barValue: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '500',
      width: 58,
      textAlign: 'right',
    },

    // Month Cards
    monthCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: THEME.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    monthLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: THEME.spacing.md,
    },
    monthDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      opacity: 0.6,
    },
    monthName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    monthEntries: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 1,
    },
    monthRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: THEME.spacing.sm,
    },
    monthTotal: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingTop: 100,
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
      maxWidth: 260,
    },
  });
