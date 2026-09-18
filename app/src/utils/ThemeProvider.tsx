import React, { useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemeContext, darkColors, lightColors, type ThemeMode } from './theme';

const SETTINGS_FILE = Platform.OS !== 'web' ? FileSystem.documentDirectory + 'theme_settings.json' : '';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadMode() {
      try {
        if (Platform.OS === 'web') {
          const stored = window.localStorage.getItem('theme_mode');
          if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setModeState(stored as ThemeMode);
          }
        } else {
          const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
          if (info.exists) {
            const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
            const parsed = JSON.parse(content);
            if (parsed.mode) {
              setModeState(parsed.mode);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load theme mode', e);
      } finally {
        setIsReady(true);
      }
    }
    loadMode();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      if (Platform.OS === 'web') {
        window.localStorage.setItem('theme_mode', newMode);
      } else {
        await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify({ mode: newMode }));
      }
    } catch (e) {
      console.error('Failed to save theme mode', e);
    }
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isReady) return null; // Avoid flicker during loading

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
