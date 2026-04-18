import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EventTier, SportId } from '@types/index';
import { SPORTS_CATALOG } from '@constants/sports';
import { TIER_ORDER, TIER_LABELS } from '@constants/sports';
import { useTheme } from '@hooks/useTheme';
import { getTierColor } from '@theme/index';

interface FilterBarProps {
  selectedSports: SportId[];
  availableSports: SportId[];
  onToggleSport: (sportId: SportId) => void;
  selectedTiers: EventTier[];
  onToggleTier: (tier: EventTier) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Permet de masquer la barre de recherche sur certains écrans */
  showSearch?: boolean;
}

/**
 * Barre de filtres horizontale :
 *  - Recherche texte (équipes, ligues, lieux)
 *  - Chips tiers (S/A/B/C) colorés
 *  - Chips sports (uniquement ceux activés dans les paramètres)
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  selectedSports,
  availableSports,
  onToggleSport,
  selectedTiers,
  onToggleTier,
  searchQuery,
  onSearchChange,
  showSearch = true,
}) => {
  const theme = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
    >
      {showSearch && (
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: searchFocused ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          <Icon name="magnify" size={18} color={theme.colors.textMuted} />
          <TextInput
            placeholder="Rechercher une équipe, ligue ou lieu…"
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')} hitSlop={10}>
              <Icon name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Chips tiers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {TIER_ORDER.map((tier) => {
          const isActive = selectedTiers.includes(tier);
          const color = getTierColor(tier, theme.colors);
          return (
            <Pressable
              key={tier}
              onPress={() => onToggleTier(tier)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? color : 'transparent',
                  borderColor: color,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFFFFF' : color },
                ]}
              >
                Tier {tier}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Chips sports */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {availableSports.map((sportId) => {
          const meta = SPORTS_CATALOG[sportId];
          if (!meta) return null;
          const isActive = selectedSports.includes(sportId);
          return (
            <Pressable
              key={sportId}
              onPress={() => onToggleSport(sportId)}
              style={[
                styles.chip,
                styles.sportChip,
                {
                  backgroundColor: isActive ? meta.color : 'transparent',
                  borderColor: meta.color,
                },
              ]}
            >
              <Icon
                name={meta.icon}
                size={14}
                color={isActive ? '#FFFFFF' : meta.color}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFFFFF' : meta.color },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  chipsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportChip: {
    flexDirection: 'row',
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
