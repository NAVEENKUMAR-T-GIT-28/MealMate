import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('mealmate-theme');
    return saved || 'dark';
  });

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const [systemIsDark, setSystemIsDark] = useState(systemDark.matches);

  useEffect(() => {
    const handler = (e) => setSystemIsDark(e.matches);
    systemDark.addEventListener('change', handler);
    return () => systemDark.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('mealmate-theme', mode);
    const resolved = mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;
    document.documentElement.setAttribute('data-theme', resolved);
  }, [mode, systemIsDark]);

  const isDark = mode === 'system' ? systemIsDark : mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
