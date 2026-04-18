import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { useEventsStore } from '@store/eventsStore';
import { usePreferencesStore } from '@store/preferencesStore';
import { useTheme } from '@hooks/useTheme';
import { EventCard } from '@components/EventCard';
import { FilterBar } from '@components/FilterBar';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { syncService } from '@services/syncService';
import { getTierColor } from '@theme/index';
import { EventTier, SportEvent, SportId } from '@types/index';
import { formatLongDate } from '@utils/dateUtils';

// Configuration de la locale française pour react-native-calendars
LocaleConfig.locales.fr = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

/**
 * Écran Calendrier : vue mensuelle + liste des événements du jour sélectionné.
 * Sur tablette (≥768px), layout deux colonnes : calendrier à gauche, liste à droite.
 */
export const CalendarScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const events = useEventsStore((s) => s.events);
  const isSyncing = useEventsStore((s) => s.isSyncing);
  const getFilteredEvents = useEventsStore((s) => s.getFilteredEvents);
  const { selectedSports: prefSports, minTier } = usePreferencesStore((s) => s.preferences);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [activeSports, setActiveSports] = useState<SportId[]>(prefSports);
  const [activeTiers, setActiveTiers] = useState<EventTier[]>(['S', 'A', 'B', 'C']);
  const [searchQuery, setSearchQuery] = useState('');

  // Resynchronise les filtres sports si l'utilisateur change ses préférences
  useEffect(() => {
    setActiveSports(prefSports);
  }, [prefSports]);

  // Lance une première synchronisation si la base est vide
  useEffect(() => {
    if (events.length === 0 && !isSyncing) {
      syncService.synchronize().catch((err) => console.warn('Sync initiale échouée', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Événements filtrés par sport, tier et recherche.
   * La mémoïsation évite des recalculs pour de grandes listes.
   */
  const filteredEvents = useMemo(
    () =>
      getFilteredEvents({
        sports: activeSports,
        tiers: activeTiers,
        searchQuery,
      }),
    [getFilteredEvents, activeSports, activeTiers, searchQuery, events]
  );

  /**
   * Dates marquées sur le calendrier. Pour chaque jour on agrège
   * jusqu'à 4 points colorés selon le tier des événements.
   */
  const markedDates = useMemo(() => {
    const map: Record<string, { dots: { color: string; key: string }[]; selected?: boolean; selectedColor?: string }> = {};

    filteredEvents.forEach((e) => {
      const day = e.startDate.substring(0, 10);
      if (!map[day]) map[day] = { dots: [] };
      const tierColor = getTierColor(e.tier, theme.colors);
      const hasTier = map[day].dots.some((d) => d.key === e.tier);
      if (!hasTier && map[day].dots.length < 4) {
        map[day].dots.push({ color: tierColor, key: e.tier });
      }
    });

    // Marquer la date sélectionnée
    if (map[selectedDate]) {
      map[selectedDate].selected = true;
      map[selectedDate].selectedColor = theme.colors.primary;
    } else {
      map[selectedDate] = { dots: [], selected: true, selectedColor: theme.colors.primary };
    }

    return map;
  }, [filteredEvents, selectedDate, theme.colors]);

  const dayEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) => e.startDate.substring(0, 10) === selectedDate)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [filteredEvents, selectedDate]
  );

  const handleSync = useCallback(async () => {
    try {
      await syncService.synchronize();
    } catch (error) {
      console.warn(error);
    }
  }, []);

  const toggleSport = (sportId: SportId) =>
    setActiveSports((current) =>
      current.includes(sportId) ? current.filter((s) => s !== sportId) : [...current, sportId]
    );

  const toggleTier = (tier: EventTier) =>
    setActiveTiers((current) =>
      current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier]
    );

  const handleEventPress = (event: SportEvent) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  // =========== Theme pour react-native-calendars ===========
  const calendarTheme = {
    backgroundColor: theme.colors.surface,
    calendarBackground: theme.colors.surface,
    textSectionTitleColor: theme.colors.textSecondary,
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: theme.colors.onPrimary,
    todayTextColor: theme.colors.primary,
    dayTextColor: theme.colors.onSurface,
    textDisabledColor: theme.colors.textMuted,
    monthTextColor: theme.colors.onSurface,
    textMonthFontWeight: '700' as const,
    arrowColor: theme.colors.primary,
    textDayFontSize: 14,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 12,
  };

  const ListContent = (
    <FlatList
      data={dayEvents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => <EventCard event={item} onPress={handleEventPress} />}
      refreshControl={
        <RefreshControl
          refreshing={isSyncing}
          onRefresh={handleSync}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      ListHeaderComponent={
        <SectionHeader
          title={formatLongDate(`${selectedDate}T00:00:00Z`)}
          subtitle={`${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}`}
        />
      }
      ListEmptyComponent={
        isSyncing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Synchronisation en cours…
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="calendar-remove-outline"
            title="Aucun événement"
            message="Aucun événement pour ce jour selon vos filtres actuels."
            actionLabel="Synchroniser"
            onAction={handleSync}
          />
        )
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FilterBar
        availableSports={prefSports}
        selectedSports={activeSports}
        onToggleSport={toggleSport}
        selectedTiers={activeTiers}
        onToggleTier={toggleTier}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isTablet ? (
        // ============ Layout tablette : 2 colonnes ============
        <View style={styles.tabletLayout}>
          <View style={[styles.tabletCalendar, { backgroundColor: theme.colors.surface }]}>
            <RNCalendar
              current={selectedDate}
              onDayPress={(d) => setSelectedDate(d.dateString)}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={calendarTheme}
              style={styles.calendar}
              enableSwipeMonths
            />
            <View style={[styles.legend, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.legendTitle, { color: theme.colors.textSecondary }]}>
                Légende
              </Text>
              {(['S', 'A', 'B', 'C'] as EventTier[]).map((tier) => (
                <View key={tier} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: getTierColor(tier, theme.colors) }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                    Tier {tier}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.tabletList}>{ListContent}</View>
        </View>
      ) : (
        // ============ Layout mobile : empilement vertical ============
        <>
          <View style={{ backgroundColor: theme.colors.surface }}>
            <RNCalendar
              current={selectedDate}
              onDayPress={(d) => setSelectedDate(d.dateString)}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={calendarTheme}
              style={styles.calendar}
              enableSwipeMonths
            />
          </View>
          {ListContent}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    paddingBottom: 8,
  },
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletCalendar: {
    width: 420,
    borderRightWidth: 1,
    borderRightColor: '#00000010',
  },
  tabletList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loading: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  legend: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
