import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme, darkTheme, lightTheme } from '@theme/index';
import { usePreferencesStore } from '@store/preferencesStore';

const ThemeContext = createContext<AppTheme>(lightTheme);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Fournit le thème courant (clair/sombre/auto) à toute l'application.
 * S'adapte aux préférences utilisateur et, en mode `auto`,
 * au thème système du téléphone/tablette.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const themeMode = usePreferencesStore(state => state.preferences.theme);

  const theme = useMemo<AppTheme>(() => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): AppTheme => useContext(ThemeContext);
