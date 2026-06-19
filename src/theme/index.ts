import { useColorScheme } from 'react-native';

// ─── Light — warm parchment + sage green + soft gold ────────────────────────

export const LIGHT = {
  // Backgrounds
  bg: '#FAF6EE',
  bgAlt: '#F2EBDD',
  card: '#F2EBDD',
  cardAlt: '#EDE4D3',
  cardBorder: 'rgba(47,42,36,0.09)',
  divider: 'rgba(47,42,36,0.07)',

  // Text
  text: '#2F2A24',
  textSub: '#6A6258',
  textMuted: '#9A8E83',

  // Primary accent — sage green
  accent: '#6E8B74',
  accentBg: 'rgba(110,139,116,0.10)',
  accentBorder: 'rgba(110,139,116,0.28)',

  // Secondary accent — soft warm gold
  gold: '#C9A96B',
  goldBg: 'rgba(201,169,107,0.12)',
  goldBorder: 'rgba(201,169,107,0.30)',
  goldText: '#C9A96B',

  // Inputs
  inputBg: 'rgba(47,42,36,0.05)',
  inputBorder: 'rgba(47,42,36,0.10)',

  // Filter chips
  chipBg: 'rgba(47,42,36,0.06)',
  chipBorder: 'rgba(47,42,36,0.09)',

  // Streak week circles
  weekCircleBg: 'rgba(47,42,36,0.06)',
  weekCircleBorder: 'rgba(47,42,36,0.09)',
  weekCircleActiveBg: 'rgba(201,169,107,0.15)',

  // Progress bar track
  progressTrack: 'rgba(47,42,36,0.08)',

  // System
  statusBar: 'dark-content' as 'dark-content' | 'light-content',
  retryBg: 'rgba(201,169,107,0.10)',
};

// ─── Dark — warm charcoal + sage green + soft gold ───────────────────────────

export const DARK = {
  // Backgrounds
  bg: '#1F1C19',
  bgAlt: '#2A2622',
  card: '#2A2622',
  cardAlt: '#322D29',
  cardBorder: 'rgba(243,237,227,0.08)',
  divider: 'rgba(243,237,227,0.06)',

  // Text
  text: '#F3EDE3',
  textSub: '#C7BFB5',
  textMuted: '#8A8178',

  // Primary accent — muted sage green
  accent: '#9EB7A2',
  accentBg: 'rgba(158,183,162,0.12)',
  accentBorder: 'rgba(158,183,162,0.28)',

  // Secondary accent — soft warm gold
  gold: '#C9A96B',
  goldBg: 'rgba(201,169,107,0.14)',
  goldBorder: 'rgba(201,169,107,0.32)',
  goldText: '#C9A96B',

  // Inputs
  inputBg: 'rgba(243,237,227,0.05)',
  inputBorder: 'rgba(243,237,227,0.09)',

  // Filter chips
  chipBg: 'rgba(243,237,227,0.05)',
  chipBorder: 'rgba(243,237,227,0.09)',

  // Streak week circles
  weekCircleBg: 'rgba(243,237,227,0.05)',
  weekCircleBorder: 'rgba(243,237,227,0.08)',
  weekCircleActiveBg: 'rgba(201,169,107,0.14)',

  // Progress bar track
  progressTrack: 'rgba(243,237,227,0.08)',

  // System
  statusBar: 'light-content' as 'dark-content' | 'light-content',
  retryBg: 'rgba(201,169,107,0.15)',
};

export type AppTheme = typeof LIGHT;

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}
