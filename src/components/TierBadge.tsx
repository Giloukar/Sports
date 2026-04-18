import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { EventTier } from '@types/index';
import { useTheme } from '@hooks/useTheme';
import { getTierColor, getTierAccentColor } from '@theme/index';

interface TierBadgeProps {
  tier: EventTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: ViewStyle;
}

/**
 * Badge coloré représentant le niveau d'importance d'un événement.
 * Le Tier S utilise un dégradé rouge → doré (deux couches) pour un
 * effet "premium" immédiatement identifiable.
 */
export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', showLabel = true, style }) => {
  const theme = useTheme();
  const primaryColor = getTierColor(tier, theme.colors);
  const accentColor = getTierAccentColor(tier, theme.colors);

  const dims =
    size === 'sm' ? { padV: 2, padH: 6, fontSize: 10, radius: 4 }
    : size === 'lg' ? { padV: 6, padH: 12, fontSize: 14, radius: 8 }
    : { padV: 4, padH: 8, fontSize: 12, radius: 6 };

  const label = showLabel ? `Tier ${tier}` : tier;

  // Effet "doré" pour Tier S : fond rouge + bordure dorée
  const isTierS = tier === 'S';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: primaryColor,
          paddingVertical: dims.padV,
          paddingHorizontal: dims.padH,
          borderRadius: dims.radius,
          borderWidth: isTierS ? 1.5 : 0,
          borderColor: isTierS ? accentColor : 'transparent',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize: dims.fontSize,
            color: '#FFFFFF',
            textShadowColor: isTierS ? 'rgba(0,0,0,0.3)' : 'transparent',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
