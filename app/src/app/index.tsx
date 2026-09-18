import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import { MemberRow } from '@/components/MemberRow';
import { getActiveMembers, type Member } from '@/db/members.repo';
import {
  getEntriesForDate,
  toggleMeal,
  markAllFullDay,
  type MealType,
  type MealEntry,
} from '@/db/entries.repo';
import { getDayTotal, getDayHeadcounts } from '@/db/summary.repo';
import {
  todayStr,
  addDays,
  formatDateDisplay,
} from '@/utils/dateHelpers';

export default function DayEntryScreen() {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [members, setMembers] = useState<Member[]>([]);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [dayTotal, setDayTotal] = useState(0);
  const [headcounts, setHeadcounts] = useState<Record<MealType, number>>({
    morning: 0,
    afternoon: 0,
    night: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [mems, ents, total, counts] = await Promise.all([
        getActiveMembers(),
        getEntriesForDate(selectedDate),
        getDayTotal(selectedDate),
        getDayHeadcounts(selectedDate),
      ]);
      setMembers(mems);
      setEntries(ents);
      setDayTotal(total);
      setHeadcounts(counts);
    } catch (e) {
      console.error('Failed to load day data:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData])
  );

  const getMealState = (memberId: number): Record<MealType, boolean> => {
    return {
      morning: entries.some((e) => e.member_id === memberId && e.meal_type === 'morning'),
      afternoon: entries.some((e) => e.member_id === memberId && e.meal_type === 'afternoon'),
      night: entries.some((e) => e.member_id === memberId && e.meal_type === 'night'),
    };
  };

  const handleToggle = useCallback(async (memberId: number, meal: MealType) => {
    await toggleMeal(memberId, selectedDate, meal);
    await loadData(false);
  }, [selectedDate, loadData]);

  const handleMarkAll = () => {
    Alert.alert(
      'Mark Full Day',
      `Mark all ${members.length} members for all 3 meals on ${formatDateDisplay(selectedDate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            await markAllFullDay(
              members.map((m) => m.id),
              selectedDate
            );
            await loadData(false);
          },
        },
      ]
    );
  };

  const goToPrev = () => setSelectedDate((d) => addDays(d, -1));
  const goToNext = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(todayStr());

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Navigator */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.dateNav}>
        <Pressable onPress={goToPrev} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Pressable onPress={goToToday} style={styles.dateCenter}>
          <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
          {selectedDate !== todayStr() && (
            <Text style={styles.todayHint}>Tap for today</Text>
          )}
        </Pressable>
        <Pressable onPress={goToNext} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* Day Stats */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: colors.morning }]}>
          <Text style={styles.statEmoji}>☀️</Text>
          <Text style={styles.statValue}>{headcounts.morning}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.afternoon }]}>
          <Text style={styles.statEmoji}>🌤️</Text>
          <Text style={styles.statValue}>{headcounts.afternoon}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.night }]}>
          <Text style={styles.statEmoji}>🌙</Text>
          <Text style={styles.statValue}>{headcounts.night}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ₹{dayTotal}
          </Text>
        </View>
      </Animated.View>

      {/* Mark All Button */}
      {members.length > 0 && (
        <Pressable onPress={handleMarkAll} style={styles.markAllBtn}>
          <Ionicons name="checkmark-done" size={18} color="#FFF" />
          <Text style={styles.markAllText}>Mark Full Day for All</Text>
        </Pressable>
      )}

      {/* Members List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textDim} />
            <Text style={styles.emptyTitle}>No Members Yet</Text>
            <Text style={styles.emptySubtitle}>
              Go to the Members tab to add people
            </Text>
          </View>
        ) : (
          members.map((member, idx) => (
            <MemberRow
              key={member.id}
              memberId={member.id}
              name={member.name}
              meals={getMealState(member.id)}
              onToggle={handleToggle}
              index={idx}
            />
          ))
        )}
      </ScrollView>
    </View>
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
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBtn: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.radius.full,
    backgroundColor: colors.card,
  },
  dateCenter: {
    alignItems: 'center',
  },
  dateText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  todayHint: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  statEmoji: {
    fontSize: 16,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    backgroundColor: colors.primaryDark,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
  },
  markAllText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
