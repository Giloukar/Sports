import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventsStore } from '@store/eventsStore';
import { usePreferencesStore } from '@store/preferencesStore';
import { useTheme } from '@hooks/useTheme';
import { EventCard } from '@components/EventCard';
import { EmptyState } from '@components/EmptyState';
import { SectionHeader } from '@components/SectionHeader';
import { syncService } from '@services/syncService';
import { SportEvent } from '@types/index';

/**
 * Écran Favoris : événements correspondant aux équipes et ligues favorites.
 */
export const FavoritesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const events = useEventsStore((s) => s.events);
  const isSyncing = useEventsStore((s) => s.isSyncing);
  const { favoriteTeams, favoriteLeagues } = usePreferencesStore((s) => s.preferences);

  const filtered = useMemo(() => {
    if (favoriteTeams.length === 0 && favoriteLeagues.length === 0) return [];
    return events
      .filter((e) => {
        if (favoriteLeagues.includes(e.league)) return true;
        const teamIds = [e.homeTeam?.id, e.awayTeam?.id].filter(Boolean) as string[];
        const teamNames = [e.homeTeam?.name, e.awayTeam?.name].filter(Boolean) as string[];
        return (
          teamIds.some((id) => favoriteTeams.includes(id)) ||
          teamNames.some((name) => favoriteTeams.includes(name))
        );
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events, favoriteTeams, favoriteLeagues]);

  const handleSync = useCallback(async () => {
    try {
      await syncService.synchronize();
    } catch (err) {
      console.warn(err);
    }
  }, []);

  const hasFavorites = favoriteTeams.length > 0 || favoriteLeagues.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }: { item: SportEvent }) => (
          <EventCard
            event={item}
            showDate
            onPress={(e) => navigation.navigate('EventDetail', { eventId: e.id })}
          />
        )}
        ListHeaderComponent={
          hasFavorites ? (
            <SectionHeader
              title="Vos favoris"
              subtitle={`${filtered.length} événement${filtered.length > 1 ? 's' : ''}`}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleSync}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          !hasFavorites ? (
            <EmptyState
              icon="heart-outline"
              title="Pas encore de favoris"
              message="Ajoutez des équipes ou ligues favorites depuis la fiche détaillée d'un événement ou les paramètres."
            />
          ) : (
            <EmptyState
              icon="calendar-heart"
              title="Aucun événement pour vos favoris"
              message="Vérifiez votre sélection ou synchronisez à nouveau."
              actionLabel="Synchroniser"
              onAction={handleSync}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
});
