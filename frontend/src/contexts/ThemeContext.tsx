import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings, saveSettings } from '../utils/storage';

const lightColors = {
  primary: '#1A8A7D',
  primaryLight: '#E8F5F3',
  textMain: '#2D2D2A',
  textMuted: '#6B6B66',
  background: '#FAFAF8',
  cardSurface: '#FFFFFF',
  border: '#E8E5DD',
  accentWarning: '#C4820B',
  accentWarningBg: '#FFF8ED',
  inputBg: '#FFFFFF',
};

const darkColors = {
  primary: '#22A396',
  primaryLight: '#1A3A37',
  textMain: '#F0F0F0',
  textMuted: '#A0A09F',
  background: '#1A1A1A',
  cardSurface: '#2A2A2A',
  border: '#3A3A3A',
  accentWarning: '#DCA543',
  accentWarningBg: '#2A2518',
  inputBg: '#2A2A2A',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeSetting: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  themeSetting: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeSetting, setThemeSetting] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    getSettings().then(s => setThemeSetting(s.theme));
  }, []);

  const setTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    setThemeSetting(theme);
    const settings = await getSettings();
    await saveSettings({ ...settings, theme });
  }, []);

  const isDark = themeSetting === 'system' ? systemScheme === 'dark' : themeSetting === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeSetting, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
