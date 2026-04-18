import { EventTier } from '@types/index';

/**
 * Palettes de couleurs de l'application.
 * Les tiers disposent de codes couleur explicites pour une lecture
 * immédiate dans le calendrier et la liste des événements.
 */

export interface AppColors {
  // Base
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;
  primary: string;
  primaryContainer: string;
  secondary: string;
  accent: string;

  // Texte
  onBackground: string;
  onSurface: string;
  onPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Sémantique
  success: string;
  warning: string;
  danger: string;
  info: string;
  live: string;

  // Bordures / séparateurs
  border: string;
  divider: string;
  shadow: string;

  // Codes couleur des tiers (au cœur de la UX)
  tierS: string; // Rouge/doré – ultra majeurs (NBA, Ligue 1, CL, Worlds)
  tierSGlow: string;
  tierA: string; // Orange – finales
  tierB: string; // Bleu – phases finales / playoffs
  tierC: string; // Gris – régulier / secondaire
}

// =================== Thème clair ===================
const lightColors: AppColors = {
  background: '#F7F8FB',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF1F6',
  surfaceElevated: '#FFFFFF',
  primary: '#1E40AF',
  primaryContainer: '#DBE4FF',
  secondary: '#0EA5E9',
  accent: '#F59E0B',

  onBackground: '#0F172A',
  onSurface: '#0F172A',
  onPrimary: '#FFFFFF',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  success: '#16A34A',
  warning: '#F97316',
  danger: '#DC2626',
  info: '#0284C7',
  live: '#EF4444',

  border: '#E2E8F0',
  divider: '#EEF1F6',
  shadow: 'rgba(15, 23, 42, 0.08)',

  tierS: '#D92D20',
  tierSGlow: '#F59E0B',
  tierA: '#F97316',
  tierB: '#2563EB',
  tierC: '#94A3B8',
};

// =================== Thème sombre ===================
const darkColors: AppColors = {
  background: '#0B1120',
  surface: '#111827',
  surfaceVariant: '#1E293B',
  surfaceElevated: '#1F2937',
  primary: '#3B82F6',
  primaryContainer: '#1E3A8A',
  secondary: '#38BDF8',
  accent: '#FBBF24',

  onBackground: '#F1F5F9',
  onSurface: '#F1F5F9',
  onPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',

  success: '#22C55E',
  warning: '#FB923C',
  danger: '#EF4444',
  info: '#38BDF8',
  live: '#F87171',

  border: '#1F2937',
  divider: '#1E293B',
  shadow: 'rgba(0, 0, 0, 0.4)',

  tierS: '#F43F5E',
  tierSGlow: '#FBBF24',
  tierA: '#FB923C',
  tierB: '#60A5FA',
  tierC: '#64748B',
};

// =================== Typographie ===================
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
    hero: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

// =================== Espacements et rayons ===================
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
};

export interface AppTheme {
  dark: boolean;
  colors: AppColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
}

export const lightTheme: AppTheme = {
  dark: false,
  colors: lightColors,
  typography,
  spacing,
  radius,
  shadows,
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: darkColors,
  typography,
  spacing,
  radius,
  shadows,
};

/**
 * Retourne la couleur principale correspondant à un tier.
 */
export function getTierColor(tier: EventTier, colors: AppColors): string {
  switch (tier) {
    case 'S':
      return colors.tierS;
    case 'A':
      return colors.tierA;
    case 'B':
      return colors.tierB;
    case 'C':
      return colors.tierC;
    default:
      return colors.textMuted;
  }
}

/**
 * Retourne la couleur secondaire (utilisée pour le dégradé Tier S, par exemple).
 */
export function getTierAccentColor(tier: EventTier, colors: AppColors): string {
  if (tier === 'S') return colors.tierSGlow;
  return getTierColor(tier, colors);
}
