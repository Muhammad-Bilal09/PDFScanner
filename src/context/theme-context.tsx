import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors, ThemeType } from '@/theme/colors';
import { LocalStorage } from '@/services/storage';

type ColorSchemeName = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorSchemeName;
  isDarkMode: boolean;
  theme: ThemeType;
  setDarkMode: (enabled: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  isDarkMode: false,
  theme: Colors.light,
  setDarkMode: async () => {},
  toggleDarkMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await LocalStorage.getSettings();
      setIsDarkModeState(settings.darkMode);
      setLoaded(true);
    };
    loadSettings();
  }, []);

  const setDarkMode = async (enabled: boolean) => {
    setIsDarkModeState(enabled);
    const settings = await LocalStorage.getSettings();
    await LocalStorage.saveSettings({
      ...settings,
      darkMode: enabled,
    });
  };

  const toggleDarkMode = async () => {
    await setDarkMode(!isDarkMode);
  };

  const activeScheme: ColorSchemeName = isDarkMode ? 'dark' : 'light';
  const theme = Colors[activeScheme];

  return (
    <ThemeContext.Provider
      value={{
        colorScheme: activeScheme,
        isDarkMode,
        theme,
        setDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
