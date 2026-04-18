import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SportId } from '@types/index';
import { SPORTS_CATALOG } from '@constants/sports';
import { useTheme } from '@hooks/useTheme';

interface SportIconProps {
  sportId: SportId;
  size?: number;
  backgroundShape?: 'circle' | 'square' | 'none';
  style?: ViewStyle;
}

/**
 * Icône vectorielle d'un sport avec fond coloré optionnel.
 * La couleur de fond dérive de la couleur du sport dans le catalogue.
 */
export const SportIcon: React.FC<SportIconProps> = ({
  sportId,
  size = 24,
  backgroundShape = 'circle',
  style,
}) => {
  const theme = useTheme();
  const meta = SPORTS_CATALOG[sportId];
  if (!meta) return null;

  const containerSize = size * 1.75;
  const borderRadius =
    backgroundShape === 'circle' ? containerSize / 2
    : backgroundShape === 'square' ? size * 0.25
    : 0;

  const showBackground = backgroundShape !== 'none';

  return (
    <View
      style={[
        styles.container,
        {
          width: showBackground ? containerSize : size,
          height: showBackground ? containerSize : size,
          backgroundColor: showBackground ? `${meta.color}22` : 'transparent',
          borderRadius,
        },
        style,
      ]}
    >
      <Icon name={meta.icon} size={size} color={meta.color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
