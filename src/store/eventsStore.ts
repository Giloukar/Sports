import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SportEvent, EventFilters, SportId } from '@types/index';

interface EventsState {
  /** Base de tous les événements chargés (cache local) */
  events: SportEvent[];
  /** Dernière erreur de synchronisation */
  lastError: string | null;
  /** Timestamp de la dernière synchronisation réussie */
  lastSyncedAt: string | null;
  /** Indique si une synchronisation est en cours */
  isSyncing: boolean;

  // Actions
  setEvents: (events: SportEvent[]) => void;
  mergeEvents: (events: SportEvent[]) => void;
  upsertEvent: (event: SportEvent) => void;
  removeEvent: (id: string) => void;
  removeEventsBySport: (sportId: SportId) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncedAt: (timestamp: string) => void;
  clearEvents: () => void;

  // Sélecteurs dérivés
  getFilteredEvents: (filters: EventFilters) => SportEvent[];
  getEventById: (id: string) => SportEvent | undefined;
  getUpcomingEvents: (limit?: number) => SportEvent[];
  getLiveEvents: () => SportEvent[];
  getEventsForDay: (date: Date) => SportEvent[];
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: [],
      lastError: null,
      lastSyncedAt: null,
      isSyncing: false,

      setEvents: (events) => set({ events }),

      /**
       * Fusionne les événements entrants avec ceux en cache.
       * Un événement existant est remplacé si sa version est plus récente.
       */
      mergeEvents: (incoming) =>
        set((state) => {
          const map = new Map<string, SportEvent>();
          state.events.forEach((e) => map.set(e.id, e));
          incoming.forEach((e) => {
            const existing = map.get(e.id);
            if (!existing || (e.lastSyncedAt ?? '') >= (existing.lastSyncedAt ?? '')) {
              map.set(e.id, e);
            }
          });
          return { events: Array.from(map.values()) };
        }),

      upsertEvent: (event) =>
        set((state) => {
          const others = state.events.filter((e) => e.id !== event.id);
          return { events: [...others, event] };
        }),

      removeEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

      removeEventsBySport: (sportId) =>
        set((state) => ({ events: state.events.filter((e) => e.sportId !== sportId) })),

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setError: (error) => set({ lastError: error }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      clearEvents: () => set({ events: [] }),

      // ============== Sélecteurs ==============

      getFilteredEvents: (filters) => {
        const { events } = get();
        return events.filter((event) => {
          if (filters.sports && filters.sports.length > 0 && !filters.sports.includes(event.sportId)) {
            return false;
          }
          if (filters.tiers && filters.tiers.length > 0 && !filters.tiers.includes(event.tier)) {
            return false;
          }
          if (filters.leagues && filters.leagues.length > 0 && !filters.leagues.includes(event.league)) {
            return false;
          }
          if (filters.status && filters.status.length > 0 && !filters.status.includes(event.status)) {
            return false;
          }
          if (filters.startDate && event.startDate < filters.startDate) {
            return false;
          }
          if (filters.endDate && event.startDate > filters.endDate) {
            return false;
          }
          if (filters.teams && filters.teams.length > 0) {
            const eventTeams = [event.homeTeam?.id, event.awayTeam?.id].filter(Boolean) as string[];
            if (!filters.teams.some((t) => eventTeams.includes(t))) return false;
          }
          if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            const hay = [event.title, event.league, event.homeTeam?.name, event.awayTeam?.name, event.venue]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
      },

      getEventById: (id) => get().events.find((e) => e.id === id),

      getUpcomingEvents: (limit) => {
        const now = new Date().toISOString();
        const upcoming = get()
          .events.filter((e) => e.startDate >= now && e.status !== 'cancelled')
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
        return limit ? upcoming.slice(0, limit) : upcoming;
      },

      getLiveEvents: () => get().events.filter((e) => e.status === 'live'),

      getEventsForDay: (date) => {
        const target = date.toISOString().substring(0, 10);
        return get()
          .events.filter((e) => e.startDate.substring(0, 10) === target)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
      },
    }),
    {
      name: '@sportcalendar/events',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      /** Seul le cache d'événements est persisté, pas l'état transitoire. */
      partialize: (state) => ({
        events: state.events,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
