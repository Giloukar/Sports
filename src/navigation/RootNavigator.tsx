import React from 'react';
import { useWindowDimensions } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CalendarScreen } from '@screens/CalendarScreen';
import { TodayScreen } from '@screens/TodayScreen';
import { FavoritesScreen } from '@screens/FavoritesScreen';
import { LiveScreen } from '@screens/LiveScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { AboutScreen } from '@screens/AboutScreen';
import { EventDetailScreen } from '@screens/EventDetailScreen';
import { useTheme } from '@hooks/useTheme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/**
 * Tabs de navigation principale. L'ordre est calibré pour la lecture :
 * À venir → Calendrier → Live → Favoris.
 */
function MainTabs() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: isTablet ? 68 : 60,
          paddingBottom: isTablet ? 10 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontWeight: '700',
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: 'À venir',
          tabBarIcon: ({ color, size }) => <Icon name="clock-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendrier',
          tabBarIcon: ({ color, size }) => <Icon name="calendar-month" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Live"
        component={LiveScreen}
        options={{
          title: 'En direct',
          tabBarIcon: ({ color, size }) => <Icon name="broadcast" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, size }) => <Icon name="star-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Drawer principal pour l'accès aux paramètres et à propos.
 * Optimisé pour tablette (drawer permanent sur les grands écrans).
 */
function DrawerNavigator() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isLargeTablet = width >= 1024;

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: isLargeTablet ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: isLargeTablet ? 260 : 280,
          borderRightColor: theme.colors.border,
          borderRightWidth: 1,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerActiveBackgroundColor: theme.colors.primaryContainer,
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: -8,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontWeight: '700',
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          title: 'Accueil',
          drawerLabel: 'Accueil',
          drawerIcon: ({ color }) => <Icon name="home-variant" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Paramètres',
          drawerIcon: ({ color }) => <Icon name="cog-outline" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'À propos',
          drawerIcon: ({ color }) => <Icon name="information-outline" size={20} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

/**
 * Racine de navigation : stack pour permettre la navigation modale
 * (EventDetail) depuis n'importe quel écran.
 */
export const RootNavigator: React.FC = () => {
  const theme = useTheme();
  const navTheme = theme.dark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={DrawerNavigator} />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
