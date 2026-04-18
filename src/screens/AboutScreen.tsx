import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@hooks/useTheme';

/**
 * Écran À propos : informations sur l'application, crédits et licences.
 */
export const AboutScreen: React.FC = () => {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <Icon name="calendar-star" size={56} color="#FFFFFF" />
        <Text style={styles.heroTitle}>Sport Calendar</Text>
        <Text style={styles.heroSubtitle}>Sport + Esport, tout au même endroit</Text>
      </View>

      <Section title="Fonctionnalités">
        <Feature icon="calendar-month" text="Calendrier multi-sports complet" />
        <Feature icon="trophy" text="Code couleur par importance (Tier S/A/B/C)" />
        <Feature icon="bell-ring" text="Notifications configurables" />
        <Feature icon="google" text="Synchronisation Google Calendar" />
        <Feature icon="cached" text="Fonctionnement hors ligne avec persistance locale" />
        <Feature icon="theme-light-dark" text="Thème clair/sombre adaptatif" />
      </Section>

      <Section title="Sources de données">
        <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
          TheSportsDB pour les sports traditionnels, PandaScore pour les compétitions esport.
          Les données peuvent différer des sites officiels et sont fournies à titre indicatif.
        </Text>
      </Section>

      <Section title="Technique">
        <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
          Application React Native · TypeScript · Zustand · AsyncStorage ·
          react-native-calendars · react-native-push-notification
        </Text>
      </Section>

      <Text style={[styles.version, { color: theme.colors.textMuted }]}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );
};

const Feature: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const theme = useTheme();
  return (
    <View style={styles.feature}>
      <Icon name={icon} size={20} color={theme.colors.primary} />
      <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  hero: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
