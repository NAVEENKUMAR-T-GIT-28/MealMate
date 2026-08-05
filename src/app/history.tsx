import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/utils/theme';
import { getMonthsWithData } from '@/db/summary.repo';
import { formatMonth } from '@/utils/dateHelpers';

interface MonthItem {
  month: string;
  entryCount: number;
}

export default function HistoryScreen() {
  const [months, setMonths] = useState<MonthItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await getMonthsWithData();
          setMonths(data);
        } catch (e) {
          console.error('Failed to load history:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={months}
        keyExtractor={(item) => item.month}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={THEME.colors.textDim} />
            <Text style={styles.emptyTitle}>No History</Text>
            <Text style={styles.emptySubtitle}>
              Start marking meals on the Today tab to build history
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInLeft.delay(index * 80).springify()}>
            <Pressable
              onPress={() => router.push(`/summary/${item.month}`)}
              style={styles.monthCard}
            >
              <View style={styles.monthLeft}>
                <View style={styles.calendarIcon}>
                  <Ionicons name="calendar" size={24} color={THEME.colors.primary} />
                </View>
                <View>
                  <Text style={styles.monthName}>{formatMonth(item.month)}</Text>
                  <Text style={styles.monthMeta}>
                    {item.entryCount} meal entries
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={THEME.colors.textDim} />
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  calendarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthName: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  monthMeta: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    gap: THEME.spacing.md,
  },
  emptyTitle: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },
});
