import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { THEME, useAppTheme, type ThemeColors } from '../utils/theme';

export type MealType = 'morning' | 'afternoon' | 'night';

interface MealToggleProps {
  mealType: MealType;
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const getMealConfig = (colors: ThemeColors): Record<MealType, { label: string; emoji: string; color: string; bgColor: string }> => ({
  morning: { label: 'Morn', emoji: '☀️', color: colors.morning, bgColor: colors.morningBg },
  afternoon: { label: 'Aft', emoji: '🌤️', color: colors.afternoon, bgColor: colors.afternoonBg },
  night: { label: 'Night', emoji: '🌙', color: colors.night, bgColor: colors.nightBg },
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MealToggle({ mealType, isActive, onToggle, disabled = false }: MealToggleProps) {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scale = useSharedValue(1);
  const config = getMealConfig(colors)[mealType];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onToggle}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.toggle,
        animatedStyle,
        {
          backgroundColor: isActive ? config.color : config.bgColor,
          borderColor: config.color,
          borderWidth: isActive ? 0 : 1,
          opacity: disabled ? 0.75 : 1,
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
