import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SportEvent } from '@types/index';
import { SPORTS_CATALOG } from '@constants/sports';
import { useTheme } from '@hooks/useTheme';
import { getTierColor } from '@theme/index';
import { formatTime, formatRelativeDate } from '@utils/dateUtils';
import { TierBadge } from './TierBadge';
import { SportIcon } from './SportIcon';

interface EventCardProps {
  event: SportEvent;
  onPress?: (event: SportEvent) => void;
  compact?: boolean;
  /** Affiche la date relative plutôt que juste l'heure */
  showDate?: boolean;
}

/**
 * Carte d'événement – composant central de la liste et du calendrier.
 *
 * Mise en page :
 *  - Ruban de couleur à gauche = tier de l'événement
 *  - Icône du sport + ligue en haut
 *  - Équipes / titre au centre
 *  - Scores live à droite si applicable
 *  - Heure et diffusion en bas
 */
export const EventCard: React.FC<EventCardProps> = memo(({ event, onPress, compact, showDate }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const meta = SPORTS_CATALOG[event.sportId];
  const tierColor = getTierColor(event.tier, theme.colors);

  const isLive = event.status === 'live';
  const isFinished = event.status === 'finished';

  const scoreText = () => {
    if (event.homeScore == null || event.awayScore == null) return null;
    return `${event.homeScore} – ${event.awayScore}`;
  };

  return (
    <Pressable
      onPress={() => onPress?.(event)}
      android_ripple={{ color: theme.colors.surfaceVariant }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.92 : 1,
          padding: compact ? theme.spacing.md : theme.spacing.lg,
          ...theme.shadows.sm,
        },
      ]}
    >
      {/* Ruban coloré tier */}
      <View style={[styles.tierStrip, { backgroundColor: tierColor }]} />

      <View style={styles.content}>
        {/* En-tête : icône sport + ligue + tier */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SportIcon sportId={event.sportId} size={compact ? 18 : 22} />
            <View style={styles.headerText}>
              <Text
                style={[styles.league, { color: theme.colors.textSecondary, fontSize: compact ? 12 : 13 }]}
                numberOfLines={1}
              >
                {event.league}
              </Text>
              {event.round && (
                <Text style={[styles.round, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {event.round}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {isLive && (
              <View style={[styles.liveBadge, { backgroundColor: theme.colors.live }]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            <TierBadge tier={event.tier} size="sm" showLabel={!isTablet ? false : true} />
          </View>
        </View>

        {/* Titre ou équipes */}
        <View style={styles.body}>
          {event.homeTeam && event.awayTeam ? (
            <View style={styles.teamsRow}>
              <View style={styles.teamBlock}>
                <Text
                  style={[
                    styles.teamName,
                    { color: theme.colors.onSurface, fontSize: compact ? 14 : 16 },
                  ]}
                  numberOfLines={1}
                >
                  {event.homeTeam.name}
                </Text>
                <Text
                  style={[
                    styles.teamName,
                    { color: theme.colors.onSurface, fontSize: compact ? 14 : 16 },
                  ]}
                  numberOfLines={1}
                >
                  {event.awayTeam.name}
                </Text>
              </View>
              {scoreText() && (
                <View
                  style={[
                    styles.scoreBox,
                    {
                      backgroundColor: isLive ? `${theme.colors.live}18` : theme.colors.surfaceVariant,
                      borderColor: isLive ? theme.colors.live : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.homeScore,
                      {
                        color:
                          isFinished && (event.homeScore ?? 0) > (event.awayScore ?? 0)
                            ? theme.colors.onSurface
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {event.homeScore}
                  </Text>
                  <Text
                    style={[
                      styles.awayScore,
                      {
                        color:
                          isFinished && (event.awayScore ?? 0) > (event.homeScore ?? 0)
                            ? theme.colors.onSurface
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {event.awayScore}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {event.title}
            </Text>
          )}
        </View>

        {/* Pied : heure + diffusion + lieu */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Icon name="clock-outline" size={14} color={theme.colors.textMuted} />
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              {showDate ? formatRelativeDate(event.startDate) : formatTime(event.startDate)}
            </Text>
          </View>

          {event.venue && (
            <View style={styles.footerItem}>
              <Icon name="map-marker-outline" size={14} color={theme.colors.textMuted} />
              <Text
                style={[styles.footerText, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {event.venue}
              </Text>
            </View>
          )}

          {event.broadcast && event.broadcast.length > 0 && (
            <View style={styles.footerItem}>
              <Icon name="television-classic" size={14} color={theme.colors.textMuted} />
              <Text
                style={[styles.footerText, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {event.broadcast[0]}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

EventCard.displayName = 'EventCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  tierStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    flex: 1,
    paddingLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  league: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  round: {
    fontSize: 11,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  body: {
    marginBottom: 10,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamBlock: {
    flex: 1,
    gap: 4,
  },
  teamName: {
    fontWeight: '600',
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 42,
    gap: 2,
  },
  homeScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  awayScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
