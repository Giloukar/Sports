import { addDays } from 'date-fns';
import { SportProvider, SportId, SportEvent } from '@types/index';
import { sportsDbProvider } from './sportsDbProvider';
import { esportsProvider } from './esportsProvider';
import { SPORTS_CATALOG } from '@constants/sports';
import { useEventsStore } from '@store/eventsStore';
import { usePreferencesStore } from '@store/preferencesStore';
import { notificationService } from './notificationService';
import { googleCalendarService } from './googleCalendarService';
import { mockDataProvider } from './mockDataProvider';

/**
 * Le SyncService orchestre les providers pour agréger les événements.
 * Il est conçu pour être facilement étendu : ajoutez un nouveau
 * provider implémentant l'interface `SportProvider` et poussez-le
 * dans le tableau `providers`.
 */
class SyncService {
  private providers: SportProvider[] = [sportsDbProvider, esportsProvider, mockDataProvider];

  /**
   * Lance une synchronisation complète :
   *  1. Fenêtre temporelle : J-7 à J+60
   *  2. Récupération parallèle via tous les providers
   *  3. Fusion dans le store local
   *  4. Planification des notifications et ajout optionnel à Google Calendar
   */
  async synchronize(options?: { sports?: SportId[]; days?: number }): Promise<{ added: number; total: number }> {
    const store = useEventsStore.getState();
    const prefs = usePreferencesStore.getState().preferences;

    store.setSyncing(true);
    store.setError(null);

    try {
      const days = options?.days ?? 60;
      const from = addDays(new Date(), -7);
      const to = addDays(new Date(), days);

      // Sports à synchroniser : intersection entre la demande explicite
      // et les préférences utilisateur.
      const requestedSports = options?.sports ?? prefs.selectedSports;
      const sportsByCategory = this.splitByCategory(requestedSports);

      const all: SportEvent[] = [];

      for (const provider of this.providers) {
        try {
          const applicableSports =
            provider.id === 'pandascore' ? sportsByCategory.esport
            : provider.id === 'thesportsdb' ? sportsByCategory.sport
            : requestedSports;

          if (applicableSports.length === 0) continue;

          const events = await provider.fetchEvents({
            sports: applicableSports,
            from,
            to,
          });
          all.push(...events);
        } catch (error) {
          console.warn(`[SyncService] Provider ${provider.id} a échoué`, error);
        }
      }

      store.mergeEvents(all);
      const timestamp = new Date().toISOString();
      store.setLastSyncedAt(timestamp);
      usePreferencesStore.getState().setLastSyncAt(timestamp);

      // Post-traitements : notifications + Google Calendar
      await this.scheduleUpcomingNotifications();
      if (prefs.googleCalendar.enabled && prefs.googleCalendar.autoSync) {
        await this.syncUpcomingToGoogleCalendar();
      }

      return { added: all.length, total: useEventsStore.getState().events.length };
    } catch (error: any) {
      const message = error?.message ?? 'Erreur inconnue';
      store.setError(message);
      throw error;
    } finally {
      store.setSyncing(false);
    }
  }

  private splitByCategory(sports: SportId[]): { sport: SportId[]; esport: SportId[] } {
    const sport: SportId[] = [];
    const esport: SportId[] = [];
    sports.forEach((id) => {
      const meta = SPORTS_CATALOG[id];
      if (!meta) return;
      if (meta.category === 'sport') sport.push(id);
      else esport.push(id);
    });
    return { sport, esport };
  }

  /**
   * (Ré)planifie les notifications pour tous les événements à venir
   * selon les préférences utilisateur.
   */
  private async scheduleUpcomingNotifications(): Promise<void> {
    const prefs = usePreferencesStore.getState().preferences;
    if (!prefs.notifications.enabled) return;

    const upcoming = useEventsStore.getState().getUpcomingEvents(200);
    notificationService.cancelAll();
    upcoming.forEach((event) => notificationService.scheduleForEvent(event, prefs.notifications));
  }

  private async syncUpcomingToGoogleCalendar(): Promise<void> {
    const prefs = usePreferencesStore.getState().preferences;
    const upcoming = useEventsStore.getState().getUpcomingEvents(50);
    const filtered = prefs.googleCalendar.onlyImportant
      ? upcoming.filter((e) => e.tier === 'S' || e.tier === 'A')
      : upcoming;

    for (const event of filtered) {
      try {
        await googleCalendarService.upsertEvent(event);
      } catch (error) {
        console.warn('[SyncService] Sync Google Calendar échouée pour', event.id, error);
      }
    }
  }
}

export const syncService = new SyncService();
