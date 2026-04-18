import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { SportEvent } from '@types/index';
import { SPORTS_CATALOG } from '@constants/sports';
import { usePreferencesStore } from '@store/preferencesStore';
import { getTierColor } from '@theme/index';

/**
 * Service d'intégration Google Calendar.
 *
 * ⚠️ Configuration requise :
 *  - Créer un projet sur https://console.cloud.google.com
 *  - Activer l'API Google Calendar
 *  - Créer des identifiants OAuth 2.0 type "Android" avec le SHA-1 de
 *    votre clé de debug/release et le package `com.sportcalendar`
 *  - Copier le Web Client ID dans `WEB_CLIENT_ID` ci-dessous
 */

const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'; // À remplacer
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Couleurs Google Calendar (IDs officiels 1-11).
 * Nous mappons nos tiers pour conserver la codification visuelle.
 */
const GOOGLE_COLOR_BY_TIER: Record<SportEvent['tier'], string> = {
  S: '11', // Rouge tomate
  A: '6',  // Orange
  B: '9',  // Bleu vif
  C: '8',  // Gris
};

interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

class GoogleCalendarService {
  private configured = false;

  /**
   * Configure le Google Sign-In client (appelé une seule fois).
   */
  configure(): void {
    if (this.configured) return;

    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      offlineAccess: true,
    });

    this.configured = true;
  }

  /**
   * Lance le flow OAuth Google. Met à jour les préférences avec
   * l'email de l'utilisateur et active l'intégration.
   */
  async signIn(): Promise<{ email: string } | null> {
    this.configure();

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const email = userInfo?.user?.email ?? userInfo?.data?.user?.email;

      if (email) {
        usePreferencesStore.getState().updateGoogleCalendar({
          enabled: true,
          userEmail: email,
        });
        return { email };
      }
      return null;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.info('[GoogleCalendar] Connexion annulée par l\'utilisateur');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.warn('[GoogleCalendar] Play Services indisponibles');
      } else {
        console.error('[GoogleCalendar] Erreur sign-in', error);
      }
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } finally {
      usePreferencesStore.getState().updateGoogleCalendar({
        enabled: false,
        userEmail: undefined,
        calendarId: undefined,
      });
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch {
      return false;
    }
  }

  /**
   * Récupère un access token frais pour appeler l'API Calendar.
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken ?? null;
    } catch (error) {
      console.warn('[GoogleCalendar] Impossible d\'obtenir le token', error);
      return null;
    }
  }

  /**
   * Liste les calendriers de l'utilisateur pour lui laisser choisir
   * celui dans lequel ajouter les événements.
   */
  async listCalendars(): Promise<GoogleCalendarItem[]> {
    const token = await this.getAccessToken();
    if (!token) return [];

    try {
      const resp = await axios.get(`${CALENDAR_API_BASE}/users/me/calendarList`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp.data.items.map((c: any) => ({
        id: c.id,
        summary: c.summary,
        primary: c.primary,
      }));
    } catch (error) {
      console.error('[GoogleCalendar] Erreur listCalendars', error);
      return [];
    }
  }

  /**
   * Ajoute ou met à jour un événement dans Google Calendar.
   * Utilise l'`id` de l'événement comme clé d'idempotence : les
   * synchronisations successives ne créent pas de doublons.
   */
  async upsertEvent(event: SportEvent): Promise<boolean> {
    const prefs = usePreferencesStore.getState().preferences.googleCalendar;
    const token = await this.getAccessToken();
    if (!token || !prefs.enabled) return false;

    const calendarId = prefs.calendarId ?? 'primary';
    const meta = SPORTS_CATALOG[event.sportId];

    // Google n'accepte que [a-v0-9] pour les IDs, max 1024 caractères.
    const safeId = `sc${event.id.replace(/[^a-v0-9]/g, '').substring(0, 60)}`;

    const endDate = event.endDate ??
      new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();

    const description = [
      `Sport : ${meta?.label ?? event.sportId}`,
      `Ligue : ${event.league}`,
      event.round ? `Phase : ${event.round}` : null,
      event.venue ? `Lieu : ${event.venue}` : null,
      event.broadcast?.length ? `Diffusion : ${event.broadcast.join(', ')}` : null,
      `Importance : Tier ${event.tier}`,
    ]
      .filter(Boolean)
      .join('\n');

    const body = {
      id: safeId,
      summary: event.title,
      description,
      start: { dateTime: event.startDate },
      end: { dateTime: endDate },
      location: event.venue,
      colorId: GOOGLE_COLOR_BY_TIER[event.tier],
      source: {
        title: 'Sport Calendar',
        url: 'https://sportcalendar.app',
      },
    };

    try {
      // Tentative d'update
      await axios.put(
        `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${safeId}`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (error: any) {
      // Si l'événement n'existe pas, on le crée
      if (error.response?.status === 404 || error.response?.status === 410) {
        try {
          await axios.post(
            `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
            body,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return true;
        } catch (err) {
          console.error('[GoogleCalendar] Erreur create', err);
          return false;
        }
      }
      console.error('[GoogleCalendar] Erreur upsert', error.response?.data ?? error);
      return false;
    }
  }

  /**
   * Supprime un événement du calendrier Google.
   */
  async deleteEvent(event: SportEvent): Promise<boolean> {
    const prefs = usePreferencesStore.getState().preferences.googleCalendar;
    const token = await this.getAccessToken();
    if (!token || !prefs.enabled) return false;

    const calendarId = prefs.calendarId ?? 'primary';
    const safeId = `sc${event.id.replace(/[^a-v0-9]/g, '').substring(0, 60)}`;

    try {
      await axios.delete(
        `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${safeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (error: any) {
      // 404/410 = déjà absent, on considère OK
      if (error.response?.status === 404 || error.response?.status === 410) return true;
      console.error('[GoogleCalendar] Erreur delete', error);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
