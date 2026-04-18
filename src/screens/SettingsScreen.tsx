import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePreferencesStore } from '@store/preferencesStore';
import { useTheme } from '@hooks/useTheme';
import { SPORTS_BY_CATEGORY } from '@constants/sports';
import { ThemeMode, EventTier, SportId } from '@types/index';
import { TIER_ORDER, TIER_LABELS, TIER_DESCRIPTIONS } from '@constants/sports';
import { getTierColor } from '@theme/index';
import { googleCalendarService } from '@services/googleCalendarService';
import { syncService } from '@services/syncService';
import { notificationService } from '@services/notificationService';

/**
 * Écran Paramètres : sélection des sports, notifications, Google Calendar, thème.
 * Toutes les modifications sont auto-sauvegardées via le store Zustand persisté.
 */
export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const preferences = usePreferencesStore((s) => s.preferences);
  const toggleSport = usePreferencesStore((s) => s.toggleSport);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const updateNotifications = usePreferencesStore((s) => s.updateNotifications);
  const updateGoogleCalendar = usePreferencesStore((s) => s.updateGoogleCalendar);
  const setMinTier = usePreferencesStore((s) => s.setMinTier);
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences);

  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await googleCalendarService.signIn();
      if (result) {
        Alert.alert('Google Calendar connecté', `Compte : ${result.email}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleCalendarService.signOut();
    Alert.alert('Déconnecté', 'Votre compte Google a été déconnecté.');
  };

  const handleTestNotification = async () => {
    const granted = await notificationService.requestPermission();
    if (!granted) {
      Alert.alert('Permission refusée', 'Activez les notifications dans les paramètres système.');
      return;
    }
    // Notification immédiate pour vérification
    const testEvent = {
      id: 'test-notification',
      title: 'Test Sport Calendar',
      sportId: 'football' as SportId,
      category: 'sport' as const,
      startDate: new Date(Date.now() + 5_000).toISOString(),
      league: 'Test League',
      tier: 'S' as EventTier,
      status: 'scheduled' as const,
    };
    notificationService.scheduleForEvent(testEvent, {
      enabled: true,
      reminderMinutes: [0],
      onlyImportant: false,
      onLiveStart: false,
    });
    Alert.alert('Notification programmée', 'Une notification va arriver dans 5 secondes.');
  };

  const handleFullSync = async () => {
    try {
      const result = await syncService.synchronize();
      Alert.alert('Synchronisation terminée', `${result.added} événements traités. Total en cache : ${result.total}.`);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message ?? 'Impossible de synchroniser');
    }
  };

  const handleReset = () =>
    Alert.alert(
      'Réinitialiser',
      'Supprimer toutes vos préférences et revenir aux valeurs par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => resetPreferences(),
        },
      ]
    );

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      {/* =============== Sports =============== */}
      <SettingsSection title="Sports traditionnels" subtitle="Sélection affichée dans le calendrier">
        <View style={styles.gridContainer}>
          {SPORTS_BY_CATEGORY.sport.map((meta) => {
            const isSelected = preferences.selectedSports.includes(meta.id);
            return (
              <Pressable
                key={meta.id}
                onPress={() => toggleSport(meta.id)}
                style={[
                  styles.sportCard,
                  {
                    backgroundColor: isSelected ? `${meta.color}18` : theme.colors.surface,
                    borderColor: isSelected ? meta.color : theme.colors.border,
                  },
                ]}
                android_ripple={{ color: `${meta.color}22` }}
              >
                <Icon name={meta.icon} size={24} color={meta.color} />
                <Text
                  style={[
                    styles.sportLabel,
                    { color: isSelected ? theme.colors.onSurface : theme.colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {meta.label}
                </Text>
                {isSelected && (
                  <View style={[styles.checkMark, { backgroundColor: meta.color }]}>
                    <Icon name="check" size={10} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </SettingsSection>

      <SettingsSection title="Esports" subtitle="Jeux compétitifs">
        <View style={styles.gridContainer}>
          {SPORTS_BY_CATEGORY.esport.map((meta) => {
            const isSelected = preferences.selectedSports.includes(meta.id);
            return (
              <Pressable
                key={meta.id}
                onPress={() => toggleSport(meta.id)}
                style={[
                  styles.sportCard,
                  {
                    backgroundColor: isSelected ? `${meta.color}18` : theme.colors.surface,
                    borderColor: isSelected ? meta.color : theme.colors.border,
                  },
                ]}
                android_ripple={{ color: `${meta.color}22` }}
              >
                <Icon name={meta.icon} size={24} color={meta.color} />
                <Text
                  style={[
                    styles.sportLabel,
                    { color: isSelected ? theme.colors.onSurface : theme.colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {meta.label}
                </Text>
                {isSelected && (
                  <View style={[styles.checkMark, { backgroundColor: meta.color }]}>
                    <Icon name="check" size={10} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </SettingsSection>

      {/* =============== Tiers =============== */}
      <SettingsSection title="Importance minimum" subtitle="Affiche les événements à partir de ce tier">
        {TIER_ORDER.map((tier) => {
          const isSelected = preferences.minTier === tier;
          const color = getTierColor(tier, theme.colors);
          return (
            <Pressable
              key={tier}
              onPress={() => setMinTier(tier)}
              style={[
                styles.rowBase,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isSelected ? color : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              android_ripple={{ color: `${color}15` }}
            >
              <View style={[styles.tierPill, { backgroundColor: color }]}>
                <Text style={styles.tierPillText}>{tier}</Text>
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>{TIER_LABELS[tier]}</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.textSecondary }]}>
                  {TIER_DESCRIPTIONS[tier]}
                </Text>
              </View>
              {isSelected && <Icon name="check-circle" size={22} color={color} />}
            </Pressable>
          );
        })}
      </SettingsSection>

      {/* =============== Notifications =============== */}
      <SettingsSection title="Notifications">
        <ToggleRow
          title="Activer les notifications"
          subtitle="Rappels avant les matches importants"
          value={preferences.notifications.enabled}
          onValueChange={(v) => updateNotifications({ enabled: v })}
        />
        <ToggleRow
          title="Uniquement Tier S/A"
          subtitle="Limiter aux événements majeurs"
          value={preferences.notifications.onlyImportant}
          onValueChange={(v) => updateNotifications({ onlyImportant: v })}
        />
        <ToggleRow
          title="Notifier au coup d'envoi"
          subtitle="Alerte au début des matches"
          value={preferences.notifications.onLiveStart}
          onValueChange={(v) => updateNotifications({ onLiveStart: v })}
        />

        <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>Rappels avant l'événement</Text>
        <View style={styles.chipsRow}>
          {[5, 10, 15, 30, 60, 120, 1440].map((mins) => {
            const active = preferences.notifications.reminderMinutes.includes(mins);
            const label = mins < 60 ? `${mins} min` : mins === 1440 ? '1 jour' : `${mins / 60} h`;
            return (
              <Pressable
                key={mins}
                onPress={() => {
                  const current = preferences.notifications.reminderMinutes;
                  const next = active ? current.filter((m) => m !== mins) : [...current, mins].sort((a, b) => b - a);
                  updateNotifications({ reminderMinutes: next });
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.colors.primary : 'transparent',
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? theme.colors.onPrimary : theme.colors.primary }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ActionButton
          icon="bell-ring-outline"
          label="Tester une notification"
          onPress={handleTestNotification}
          color={theme.colors.primary}
        />
      </SettingsSection>

      {/* =============== Google Calendar =============== */}
      <SettingsSection title="Google Calendar" subtitle="Synchronisez vos événements dans votre agenda">
        {preferences.googleCalendar.enabled && preferences.googleCalendar.userEmail ? (
          <>
            <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="account-check" size={20} color={theme.colors.success} />
              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                Connecté : {preferences.googleCalendar.userEmail}
              </Text>
            </View>
            <ToggleRow
              title="Synchronisation automatique"
              subtitle="Ajoute les événements dès la synchronisation"
              value={preferences.googleCalendar.autoSync}
              onValueChange={(v) => updateGoogleCalendar({ autoSync: v })}
            />
            <ToggleRow
              title="Uniquement Tier S/A"
              subtitle="Éviter de saturer votre agenda"
              value={preferences.googleCalendar.onlyImportant}
              onValueChange={(v) => updateGoogleCalendar({ onlyImportant: v })}
            />
            <ActionButton
              icon="logout"
              label="Se déconnecter"
              onPress={handleGoogleSignOut}
              color={theme.colors.danger}
            />
          </>
        ) : (
          <ActionButton
            icon="google"
            label={signingIn ? 'Connexion…' : 'Se connecter avec Google'}
            onPress={handleGoogleSignIn}
            color={theme.colors.primary}
            loading={signingIn}
          />
        )}
      </SettingsSection>

      {/* =============== Apparence =============== */}
      <SettingsSection title="Apparence">
        {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => {
          const labels: Record<ThemeMode, string> = {
            auto: 'Automatique (système)',
            light: 'Clair',
            dark: 'Sombre',
          };
          const icons: Record<ThemeMode, string> = {
            auto: 'theme-light-dark',
            light: 'white-balance-sunny',
            dark: 'weather-night',
          };
          const isActive = preferences.theme === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setTheme(mode)}
              style={[
                styles.rowBase,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}
              android_ripple={{ color: theme.colors.primaryContainer }}
            >
              <Icon name={icons[mode]} size={22} color={theme.colors.primary} />
              <View style={styles.rowTextBlock}>
                <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>{labels[mode]}</Text>
              </View>
              {isActive && <Icon name="check-circle" size={22} color={theme.colors.primary} />}
            </Pressable>
          );
        })}
      </SettingsSection>

      {/* =============== Actions avancées =============== */}
      <SettingsSection title="Avancé">
        <ActionButton
          icon="refresh"
          label="Lancer une synchronisation complète"
          onPress={handleFullSync}
          color={theme.colors.primary}
        />
        <ActionButton
          icon="restore"
          label="Réinitialiser les préférences"
          onPress={handleReset}
          color={theme.colors.danger}
        />
      </SettingsSection>

      <Text style={[styles.version, { color: theme.colors.textMuted }]}>
        Sport Calendar v1.0.0
      </Text>
    </ScrollView>
  );
};

// ======================== Sous-composants ========================

const SettingsSection: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const ToggleRow: React.FC<{
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}> = ({ title, subtitle, value, onValueChange }) => {
  const theme = useTheme();
  return (
    <View style={[styles.rowBase, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.rowSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
        thumbColor={value ? theme.colors.primary : theme.colors.surfaceVariant}
      />
    </View>
  );
};

const ActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  loading?: boolean;
}> = ({ icon, label, onPress, color, loading }) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: color }]}
      android_ripple={{ color: `${color}22` }}
    >
      {loading ? <ActivityIndicator color={color} /> : <Icon name={icon} size={20} color={color} />}
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  sectionContent: {
    gap: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportCard: {
    width: '31%',
    minWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    position: 'relative',
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  rowTextBlock: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tierPill: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
