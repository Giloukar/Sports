import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';
import { SportEvent, NotificationSettings } from '@types/index';
import { SPORTS_CATALOG } from '@constants/sports';
import { isImportantEvent } from '@utils/tierClassifier';
import { formatTime } from '@utils/dateUtils';

/**
 * Service de notifications locales.
 *
 * Stratégie :
 *  - Chaque événement peut générer plusieurs rappels (J-30min, J-10min, au coup d'envoi...)
 *  - Les identifiants de notification sont déterministes : `${eventId}-${minutes}`
 *    ce qui permet un replanifiement idempotent sans doublon.
 *  - Un canal dédié "sport-events" est créé au démarrage pour personnaliser
 *    le son / la priorité sur Android 8+.
 */

const CHANNEL_ID = 'sport-events';

class NotificationService {
  private initialized = false;

  /**
   * Initialise la librairie et crée le channel Android.
   * À appeler une seule fois au démarrage de l'app.
   */
  initialize(): void {
    if (this.initialized) return;

    PushNotification.configure({
      onNotification: (notification) => {
        // Ici, on pourrait ouvrir l'écran de détail de l'événement.
        console.log('[Notification] Reçue :', notification);
      },
      requestPermissions: Platform.OS === 'ios',
      popInitialNotification: true,
    });

    PushNotification.createChannel(
      {
        channelId: CHANNEL_ID,
        channelName: 'Événements sportifs',
        channelDescription: 'Rappels de matches et compétitions',
        importance: Importance.HIGH,
        vibrate: true,
        playSound: true,
      },
      (created) => console.log(`[Notification] Channel créé: ${created}`)
    );

    this.initialized = true;
  }

  /**
   * Demande la permission de notifier (Android 13+).
   */
  async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions().then(
        (result) => resolve(!!result.alert),
        () => resolve(false)
      );
    });
  }

  /**
   * Planifie toutes les notifications associées à un événement selon
   * les préférences utilisateur (J-X minutes + éventuel "live start").
   */
  scheduleForEvent(event: SportEvent, settings: NotificationSettings): void {
    if (!settings.enabled) return;
    if (settings.onlyImportant && !isImportantEvent(event)) return;
    if (event.status !== 'scheduled') return;

    const startDate = new Date(event.startDate);
    const now = Date.now();

    settings.reminderMinutes.forEach((minutesBefore) => {
      const fireAt = new Date(startDate.getTime() - minutesBefore * 60_000);
      if (fireAt.getTime() <= now) return; // passé

      this.scheduleSingle({
        id: `${event.id}-${minutesBefore}`,
        date: fireAt,
        title: this.buildTitle(event),
        message: this.buildMessage(event, minutesBefore),
      });
    });

    if (settings.onLiveStart) {
      const fireAt = new Date(startDate.getTime());
      if (fireAt.getTime() > now) {
        this.scheduleSingle({
          id: `${event.id}-live`,
          date: fireAt,
          title: `🔴 LIVE – ${event.title}`,
          message: `${event.league} • Le match commence !`,
        });
      }
    }
  }

  /**
   * Annule la notification associée à un événement donné (toutes variantes).
   */
  cancelForEvent(eventId: string): void {
    PushNotification.cancelLocalNotification(`${eventId}-live`);
    // Les délais courants sont annulés préventivement
    [5, 10, 15, 30, 60, 120, 1440].forEach((m) =>
      PushNotification.cancelLocalNotification(`${eventId}-${m}`)
    );
  }

  /**
   * Efface toutes les notifications planifiées.
   * Utilisé avant un gros replanifiement global (sync).
   */
  cancelAll(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  // ======================= privés =======================

  private scheduleSingle(params: { id: string; date: Date; title: string; message: string }): void {
    PushNotification.localNotificationSchedule({
      channelId: CHANNEL_ID,
      id: params.id,
      date: params.date,
      title: params.title,
      message: params.message,
      allowWhileIdle: true,
      importance: 'high',
      priority: 'high',
      vibrate: true,
      playSound: true,
    });
  }

  private buildTitle(event: SportEvent): string {
    const meta = SPORTS_CATALOG[event.sportId];
    const emoji =
      event.tier === 'S' ? '⭐'
      : event.tier === 'A' ? '🏆'
      : event.tier === 'B' ? '🔥'
      : '⚽';
    return `${emoji} ${meta?.label ?? event.sportId} • ${event.league}`;
  }

  private buildMessage(event: SportEvent, minutesBefore: number): string {
    const delayLabel =
      minutesBefore >= 1440 ? `dans ${Math.round(minutesBefore / 1440)} j`
      : minutesBefore >= 60 ? `dans ${Math.round(minutesBefore / 60)} h`
      : `dans ${minutesBefore} min`;

    const teams =
      event.homeTeam && event.awayTeam
        ? `${event.homeTeam.name} vs ${event.awayTeam.name}`
        : event.title;

    return `${teams} – ${delayLabel} (${formatTime(event.startDate)})`;
  }
}

export const notificationService = new NotificationService();
