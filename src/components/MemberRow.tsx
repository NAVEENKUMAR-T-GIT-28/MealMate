import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { MealToggle } from './MealToggle';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import type { MealType } from '@/db/entries.repo';

interface MemberRowProps {
  memberId: number;
  name: string;
  meals: Record<MealType, boolean>;
  onToggle: (memberId: number, meal: MealType) => void;
  index: number;
}

export const MemberRow = React.memo(function MemberRow({
  memberId,
  name,
  meals,
  onToggle,
  index,
}: MemberRowProps) {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).springify()}
      style={styles.container}
    >
      <View style={styles.nameSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <View style={styles.toggles}>
        <MealToggle
          mealType="morning"
          isActive={meals.morning}
          onToggle={() => onToggle(memberId, 'morning')}
        />
        <MealToggle
          mealType="afternoon"
          isActive={meals.afternoon}
          onToggle={() => onToggle(memberId, 'afternoon')}
        />
        <MealToggle
          mealType="night"
          isActive={meals.night}
          onToggle={() => onToggle(memberId, 'night')}
        />
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.memberId === nextProps.memberId &&
    prevProps.name === nextProps.name &&
    prevProps.meals.morning === nextProps.meals.morning &&
    prevProps.meals.afternoon === nextProps.meals.afternoon &&
    prevProps.meals.night === nextProps.meals.night &&
    prevProps.onToggle === nextProps.onToggle
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  toggles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
});
