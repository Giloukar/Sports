import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEventsStore } from '@store/eventsStore';
import { useTheme } from '@hooks/useTheme';
import { EventCard } from '@components/EventCard';
import { EmptyState } from '@components/EmptyState';
import { syncService } from '@services/syncService';
import { SportEvent } from '@types/index';

/**
 * Écran Live : liste les matches actuellement en cours.
 * Rafraîchissement automatique toutes les 60 secondes.
 */
export const LiveScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const getLiveEvents = useEventsStore((s) => s.getLiveEvents);
  const events = useEventsStore((s) => s.events);
  const isSyncing = useEventsStore((s) => s.isSyncing);

  const [tick, setTick] = useState(0);

  // Tic périodique pour rafraîchir l'état "en cours" (statuts live/finished)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const liveEvents = useMemo(() => getLiveEvents(), [getLiveEvents, events, tick]);

  const handleSync = useCallback(async () => {
    try {
      await syncService.synchronize();
    } catch (err) {
      console.warn(err);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={[styles.dot, { backgroundColor: theme.colors.live }]} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>En direct</Text>
        <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
          {liveEvents.length} match{liveEvents.length > 1 ? 'es' : ''}
        </Text>
      </View>

      <FlatList
        data={liveEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }: { item: SportEvent }) => (
          <EventCard event={item} onPress={(e) => navigation.navigate('EventDetail', { eventId: e.id })} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleSync}
            tintColor={theme.colors.live}
            colors={[theme.colors.live]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="broadcast-off"
            title="Aucun match en direct"
            message="Revenez plus tard ou synchronisez pour actualiser les statuts."
            actionLabel="Actualiser"
            onAction={handleSync}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
});
