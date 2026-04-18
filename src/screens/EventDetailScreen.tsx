import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useEventsStore } from '@store/eventsStore';
import { usePreferencesStore } from '@store/preferencesStore';
import { useTheme } from '@hooks/useTheme';
import { SPORTS_CATALOG, TIER_LABELS, TIER_DESCRIPTIONS } from '@constants/sports';
import { formatLongDate, formatTime, formatRelativeDate } from '@utils/dateUtils';
import { TierBadge } from '@components/TierBadge';
import { SportIcon } from '@components/SportIcon';
import { getTierColor } from '@theme/index';
import { googleCalendarService } from '@services/googleCalendarService';

type RouteParams = { EventDetail: { eventId: string } };

/**
 * Écran détaillé d'un événement.
 * Permet :
 *  - d'ajouter au calendrier Google (si connecté)
 *  - d'ajouter l'équipe/ligue aux favoris
 *  - de partager l'événement
 *  - d'ouvrir les streams ou le site de billetterie
 */
export const EventDetailScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EventDetail'>>();
  const { eventId } = route.params;

  const event = useEventsStore((s) => s.getEventById(eventId));
  const { favoriteTeams, favoriteLeagues, googleCalendar } = usePreferencesStore((s) => s.preferences);
  const toggleFavoriteTeam = usePreferencesStore((s) => s.toggleFavoriteTeam);
  const toggleFavoriteLeague = usePreferencesStore((s) => s.toggleFavoriteLeague);

  const tierColor = useMemo(() => {
    if (!event) return theme.colors.primary;
    return getTierColor(event.tier, theme.colors);
  }, [event, theme.colors]);

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textSecondary, padding: 16 }}>Événement introuvable.</Text>
      </View>
    );
  }

  const meta = SPORTS_CATALOG[event.sportId];
  const isLeagueFavorite = favoriteLeagues.includes(event.league);
  const isHomeFavorite = !!event.homeTeam && favoriteTeams.includes(event.homeTeam.id);
  const isAwayFavorite = !!event.awayTeam && favoriteTeams.includes(event.awayTeam.id);

  const handleAddToGoogleCalendar = async () => {
    if (!googleCalendar.enabled) {
      Alert.alert(
        'Google Calendar non connecté',
        'Connectez-vous depuis les Paramètres pour ajouter cet événement à votre agenda.'
      );
      return;
    }
    const ok = await googleCalendarService.upsertEvent(event);
    Alert.alert(
      ok ? 'Ajouté à Google Calendar' : 'Erreur',
      ok
        ? 'L\'événement est maintenant dans votre agenda.'
        : 'Impossible d\'ajouter l\'événement. Vérifiez votre connexion.'
    );
  };

  const handleShare = async () => {
    try {
      const teams = event.homeTeam && event.awayTeam
        ? `${event.homeTeam.name} vs ${event.awayTeam.name}`
        : event.title;
      await Share.share({
        message: `${teams} – ${event.league}\n${formatRelativeDate(event.startDate)}\n${event.venue ?? ''}`,
      });
    } catch (error) {
      console.warn('Share error', error);
    }
  };

  const handleOpenStream = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('OpenURL error', error);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      {/* =============== Hero =============== */}
      <View style={[styles.hero, { backgroundColor: tierColor }]}>
        <View style={styles.heroTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true }}
            hitSlop={10}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <TierBadge tier={event.tier} size="md" />
        </View>

        <View style={styles.heroCenter}>
          <SportIcon sportId={event.sportId} size={36} backgroundShape="none" />
          <Text style={styles.heroLeague}>{event.league}</Text>
          {event.round && <Text style={styles.heroRound}>{event.round}</Text>}
        </View>

        {event.homeTeam && event.awayTeam ? (
          <View style={styles.teamsBlock}>
            <View style={styles.teamBig}>
              <Text style={styles.teamBigName} numberOfLines={2}>
                {event.homeTeam.name}
              </Text>
            </View>
            <View style={styles.vs}>
              {event.homeScore != null && event.awayScore != null ? (
                <Text style={styles.scoreBig}>
                  {event.homeScore} – {event.awayScore}
                </Text>
              ) : (
                <Text style={styles.vsText}>VS</Text>
              )}
              <Text style={styles.timeBig}>{formatTime(event.startDate)}</Text>
            </View>
            <View style={styles.teamBig}>
              <Text style={styles.teamBigName} numberOfLines={2}>
                {event.awayTeam.name}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.heroTitle}>{event.title}</Text>
        )}

        <Text style={styles.heroDate}>{formatLongDate(event.startDate)}</Text>
      </View>

      {/* =============== Actions principales =============== */}
      <View style={styles.actionsRow}>
        <ActionPill
          icon="calendar-plus"
          label="Agenda"
          onPress={handleAddToGoogleCalendar}
          color={theme.colors.primary}
        />
        <ActionPill
          icon="share-variant"
          label="Partager"
          onPress={handleShare}
          color={theme.colors.primary}
        />
        <ActionPill
          icon={isLeagueFavorite ? 'star' : 'star-outline'}
          label="Ligue"
          onPress={() => toggleFavoriteLeague(event.league)}
          color={isLeagueFavorite ? theme.colors.accent : theme.colors.primary}
        />
      </View>

      {/* =============== Informations =============== */}
      <InfoCard title="Informations">
        <InfoRow icon="calendar-clock" label="Date et heure" value={formatRelativeDate(event.startDate)} />
        <InfoRow
          icon="trophy"
          label="Importance"
          value={TIER_LABELS[event.tier]}
          secondary={TIER_DESCRIPTIONS[event.tier]}
        />
        <InfoRow icon={meta.icon} label="Sport" value={meta.label} />
        {event.venue && <InfoRow icon="map-marker" label="Lieu" value={event.venue} />}
        <InfoRow
          icon="information-outline"
          label="Statut"
          value={
            event.status === 'live' ? '🔴 En direct'
            : event.status === 'finished' ? 'Terminé'
            : event.status === 'cancelled' ? 'Annulé'
            : event.status === 'postponed' ? 'Reporté'
            : 'À venir'
          }
        />
      </InfoCard>

      {/* =============== Diffusion =============== */}
      {event.broadcast && event.broadcast.length > 0 && (
        <InfoCard title="Diffusion">
          {event.broadcast.map((channel, i) => {
            const isUrl = channel.startsWith('http');
            return (
              <Pressable
                key={i}
                onPress={() => isUrl && handleOpenStream(channel)}
                style={[styles.broadcastRow, { borderColor: theme.colors.border }]}
              >
                <Icon
                  name={isUrl ? 'play-circle' : 'television-classic'}
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.broadcastText, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {isUrl ? 'Regarder en live' : channel}
                </Text>
                {isUrl && <Icon name="open-in-new" size={16} color={theme.colors.textMuted} />}
              </Pressable>
            );
          })}
        </InfoCard>
      )}

      {/* =============== Équipes favorites =============== */}
      {(event.homeTeam || event.awayTeam) && (
        <InfoCard title="Équipes">
          {event.homeTeam && (
            <Pressable
              onPress={() => toggleFavoriteTeam(event.homeTeam!.id)}
              style={[styles.teamRow, { borderColor: theme.colors.border }]}
            >
              <Icon name="shield-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.teamRowName, { color: theme.colors.onSurface }]}>
                {event.homeTeam.name}
              </Text>
              <Icon
                name={isHomeFavorite ? 'star' : 'star-outline'}
                size={22}
                color={isHomeFavorite ? theme.colors.accent : theme.colors.textMuted}
              />
            </Pressable>
          )}
          {event.awayTeam && (
            <Pressable
              onPress={() => toggleFavoriteTeam(event.awayTeam!.id)}
              style={[styles.teamRow, { borderColor: theme.colors.border }]}
            >
              <Icon name="shield-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.teamRowName, { color: theme.colors.onSurface }]}>
                {event.awayTeam.name}
              </Text>
              <Icon
                name={isAwayFavorite ? 'star' : 'star-outline'}
                size={22}
                color={isAwayFavorite ? theme.colors.accent : theme.colors.textMuted}
              />
            </Pressable>
          )}
        </InfoCard>
      )}
    </ScrollView>
  );
};

// ===================== Sous-composants =====================

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const theme = useTheme();
  return (
    <View style={styles.infoCard}>
      <Text style={[styles.infoCardTitle, { color: theme.colors.onBackground }]}>{title}</Text>
      <View style={[styles.infoCardContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string; secondary?: string }> = ({
  icon,
  label,
  value,
  secondary,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={theme.colors.textMuted} />
      <View style={styles.infoRowTextBlock}>
        <Text style={[styles.infoRowLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoRowValue, { color: theme.colors.onSurface }]}>{value}</Text>
        {secondary && (
          <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>{secondary}</Text>
        )}
      </View>
    </View>
  );
};

const ActionPill: React.FC<{ icon: string; label: string; onPress: () => void; color: string }> = ({
  icon,
  label,
  onPress,
  color,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionPill, { backgroundColor: theme.colors.surface, borderColor: color }]}
      android_ripple={{ color: `${color}22` }}
    >
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.actionPillText, { color }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  hero: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  heroLeague: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  heroRound: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  heroDate: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.95,
    fontWeight: '600',
  },
  teamsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  teamBig: {
    flex: 1,
    alignItems: 'center',
  },
  teamBigName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  vs: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    opacity: 0.85,
  },
  scoreBig: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  timeBig: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
    opacity: 0.85,
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    marginTop: -4,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  infoCardContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 14,
  },
  infoRowTextBlock: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoRowValue: {
    fontSize: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  infoRowSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  broadcastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  teamRowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
