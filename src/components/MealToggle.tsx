import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import type { MealType } from '@/db/entries.repo';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MealToggleProps {
  mealType: MealType;
  isActive: boolean;
  onToggle: () => void;
}

const getMealConfig = (colors: ThemeColors): Record<MealType, { label: string; emoji: string; color: string; bgColor: string }> => ({
  morning: { label: 'Morn', emoji: '☀️', color: colors.morning, bgColor: colors.morningBg },
  afternoon: { label: 'Aft', emoji: '🌤️', color: colors.afternoon, bgColor: colors.afternoonBg },
  night: { label: 'Night', emoji: '🌙', color: colors.night, bgColor: colors.nightBg },
});

export function MealToggle({ mealType, isActive, onToggle }: MealToggleProps) {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scale = useSharedValue(1);
  const config = getMealConfig(colors)[mealType];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={onToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.toggle,
        animatedStyle,
        {
          backgroundColor: isActive ? config.color : config.bgColor,
          borderColor: config.color,
          borderWidth: isActive ? 0 : 1,
        },
      ]}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text
        style={[
          styles.label,
          { color: isActive ? '#FFFFFF' : config.color },
        ]}
      >
        {config.label}
      </Text>
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: THEME.radius.full,
    minWidth: 72,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
