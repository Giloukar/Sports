import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@hooks/useTheme';
import { RootNavigator } from '@navigation/RootNavigator';
import { notificationService } from '@services/notificationService';
import { googleCalendarService } from '@services/googleCalendarService';
import { usePreferencesStore } from '@store/preferencesStore';

// Quelques warnings bruyants venant de libs tierces, sans impact fonctionnel.
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'new NativeEventEmitter',
]);

/**
 * Racine de l'application.
 * Responsabilités :
 *  1. Monter les providers (gestures, safe area, thème)
 *  2. Initialiser les services (notifications, Google Sign-In)
 *  3. Rendre la navigation
 */
const App: React.FC = () => {
  const systemScheme = useColorScheme();
  const themeMode = usePreferencesStore((s) => s.preferences.theme);

  const effectiveDark =
    themeMode === 'auto' ? systemScheme === 'dark'
    : themeMode === 'dark';

  useEffect(() => {
    // Initialiser les notifications une seule fois
    notificationService.initialize();
    notificationService.requestPermission().catch(() => undefined);

    // Configurer Google Sign-In (sans forcer la connexion)
    googleCalendarService.configure();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar
            barStyle={effectiveDark ? 'light-content' : 'dark-content'}
            backgroundColor="transparent"
            translucent
          />
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
