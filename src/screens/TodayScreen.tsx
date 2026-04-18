import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventsStore } from '@store/eventsStore';
import { usePreferencesStore } from '@store/preferencesStore';
import { useTheme } from '@hooks/useTheme';
import { EventCard } from '@components/EventCard';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { syncService } from '@services/syncService';
import { SportEvent } from '@types/index';
import { formatLongDate, groupByDay } from '@utils/dateUtils';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Écran "À venir" : liste agrégée des prochains événements,
 * regroupés par jour (aujourd'hui, demain, +2j, etc.).
 */
export const TodayScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const getUpcomingEvents = useEventsStore((s) => s.getUpcomingEvents);
  const isSyncing = useEventsStore((s) => s.isSyncing);
  const events = useEventsStore((s) => s.events);
  const { selectedSports } = usePreferencesStore((s) => s.preferences);

  /**
   * On limite à 14 jours et on filtre selon les sports choisis.
   */
  const sections = useMemo(() => {
    const upcoming = getUpcomingEvents(200).filter((e) => selectedSports.includes(e.sportId));

    const maxDate = addDays(new Date(), 14).toISOString();
    const windowed = upcoming.filter((e) => e.startDate <= maxDate);

    const grouped = groupByDay(windowed);
    const sorted = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

    return sorted.map(([day, items]) => ({
      day,
      title: relativeLabel(day),
      data: items,
    }));
  }, [getUpcomingEvents, events, selectedSports]);

  /**
   * Applati en une liste avec éléments "header" pour FlatList.
   */
  const flat = useMemo(() => {
    const list: Array<{ type: 'header'; day: string; title: string; count: number } | { type: 'item'; event: SportEvent }> = [];
    sections.forEach((s) => {
      list.push({ type: 'header', day: s.day, title: s.title, count: s.data.length });
      s.data.forEach((event) => list.push({ type: 'item', event }));
    });
    return list;
  }, [sections]);

  const handleSync = useCallback(async () => {
    try {
      await syncService.synchronize();
    } catch (err) {
      console.warn(err);
    }
  }, []);

  const handlePress = (event: SportEvent) =>
    navigation.navigate('EventDetail', { eventId: event.id });

  const renderItem = ({ item }: { item: (typeof flat)[number] }) => {
    if (item.type === 'header') {
      return (
        <SectionHeader
          title={item.title}
          subtitle={`${item.count} événement${item.count > 1 ? 's' : ''}`}
        />
      );
    }
    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <EventCard event={item.event} onPress={handlePress} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={flat}
        keyExtractor={(item, i) => (item.type === 'header' ? `h-${item.day}` : `e-${item.event.id}-${i}`)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        numColumns={1}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleSync}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={[styles.heroKicker, { color: theme.colors.textSecondary }]}>
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </Text>
            <Text style={[styles.heroTitle, { color: theme.colors.onBackground }]}>
              Vos 14 prochains jours
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isSyncing ? (
            <EmptyState
              icon="calendar-search"
              title="Aucun événement à venir"
              message="Tirez pour synchroniser ou ajustez vos sports dans les paramètres."
              actionLabel="Synchroniser maintenant"
              onAction={handleSync}
            />
          ) : null
        }
      />
    </View>
  );
};

function relativeLabel(dayKey: string): string {
  const target = new Date(`${dayKey}T00:00:00`);
  const today = new Date();
  const diff = Math.round((target.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return formatLongDate(`${dayKey}T00:00:00Z`);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  heroKicker: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
});
