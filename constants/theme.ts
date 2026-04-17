import { DarkTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const MatchdayTheme = {
  colors: {
    night: '#070912',
    surface: '#0b1021',
    surfaceElevated: '#10182e',
    surfaceCard: '#0f172a',
    blue900: '#082f49',
    blue800: '#0b3550',
    blue700: '#164e78',
    blue500: '#4b61e3',
    sky400: '#38bdf8',
    sky200: '#c4e7ff',
    lime300: '#bef264',
    mint400: '#0ed98b',
    gold400: '#ffc107',
    coral400: '#ff7a66',
    slate900: '#0f172a',
    slate700: '#334155',
    slate500: '#64748b',
    slate300: '#cbd5e1',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    slate50: '#f8fbff',
    white: '#ffffff',
    danger: '#e11d48',
  },
  radii: {
    pill: 999,
    xl: 24,
    xxl: 32,
    card: 28,
  },
  spacing: {
    screen: 20,
    screenLg: 32,
  },
  shadows: {
    card: {
      shadowColor: '#020617',
      shadowOpacity: 0.22,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 14 },
      elevation: 12,
    },
    soft: {
      shadowColor: '#082f49',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
  },
} as const;

export const Colors = {
  light: {
    text: MatchdayTheme.colors.slate900,
    background: MatchdayTheme.colors.slate50,
    tint: MatchdayTheme.colors.blue900,
    icon: MatchdayTheme.colors.slate500,
    tabIconDefault: MatchdayTheme.colors.slate500,
    tabIconSelected: MatchdayTheme.colors.mint400,
    card: MatchdayTheme.colors.white,
    border: MatchdayTheme.colors.slate200,
  },
  dark: {
    text: MatchdayTheme.colors.white,
    background: MatchdayTheme.colors.night,
    tint: MatchdayTheme.colors.mint400,
    icon: MatchdayTheme.colors.sky200,
    tabIconDefault: '#7dd3fc',
    tabIconSelected: MatchdayTheme.colors.lime300,
    card: MatchdayTheme.colors.surfaceElevated,
    border: 'rgba(255,255,255,0.08)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    display: 'system-ui',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'sans-serif',
    display: 'sans-serif-condensed',
    mono: 'monospace',
  },
  default: {
    sans: 'sans-serif',
    display: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: "'Space Grotesk', 'Barlow', system-ui, sans-serif",
    display: "'Barlow Condensed', 'Syne', 'Space Grotesk', sans-serif",
    mono: "'Fira Code', monospace",
  },
});

export const MatchdayNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: MatchdayTheme.colors.mint400,
    background: MatchdayTheme.colors.night,
    card: MatchdayTheme.colors.surface,
    text: MatchdayTheme.colors.white,
    border: 'rgba(255,255,255,0.08)',
    notification: MatchdayTheme.colors.gold400,
  },
};
