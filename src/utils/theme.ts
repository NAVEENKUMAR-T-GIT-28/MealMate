import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as FileSystem from 'expo-file-system';

export type ThemeColors = {
  background: string;
  card: string;
  cardGlass: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  success: string;
  info: string;
  morning: string;
  morningBg: string;
  afternoon: string;
  afternoonBg: string;
  night: string;
  nightBg: string;
};

export const darkColors: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  cardGlass: 'rgba(30, 41, 59, 0.85)',
  border: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',

  morning: '#F59E0B',
  morningBg: 'rgba(245, 158, 11, 0.15)',
  afternoon: '#F97316',
  afternoonBg: 'rgba(249, 115, 22, 0.15)',
  night: '#6366F1',
  nightBg: 'rgba(99, 102, 241, 0.15)',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC', // slate-50
  card: '#FFFFFF',
  cardGlass: 'rgba(255, 255, 255, 0.85)',
  border: '#E2E8F0', // slate-200
  text: '#0F172A', // slate-900
  textMuted: '#64748B', // slate-500
  textDim: '#94A3B8', // slate-400
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',

  morning: '#F59E0B',
  morningBg: 'rgba(245, 158, 11, 0.15)',
  afternoon: '#F97316',
  afternoonBg: 'rgba(249, 115, 22, 0.15)',
  night: '#6366F1',
  nightBg: 'rgba(99, 102, 241, 0.15)',
};

export const THEME = {
  colors: darkColors, // Legacy export for non-dynamic parts if any
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },
  font: {
    regular: { fontWeight: '400' as const },
    medium: { fontWeight: '500' as const },
    semibold: { fontWeight: '600' as const },
    bold: { fontWeight: '700' as const },
  },
};

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook to get the active theme colors based on system preference.
 */
export function useAppTheme(): ThemeColors {
  const context = useContext(ThemeContext);
  if (!context) {
    const scheme = useColorScheme();
    return scheme === 'dark' ? darkColors : lightColors;
  }
  return context.colors;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}
