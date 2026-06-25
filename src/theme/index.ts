import { useColorScheme } from 'react-native';
import { useContext } from 'react';
import { AppearanceContext } from '../context/AppearanceContext';

// ─── Light — warm ivory + sage green + soft gold ─────────────────────────────

export const LIGHT = {
  // Backgrounds
  bg: '#F5F0E8',
  bgAlt: '#EDE7D9',
  card: '#EDE7D9',
  cardAlt: '#E6DDD0',
  cardBorder: 'transparent',
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

  // Card labels (quick-nav cards): dark in light mode, gold in dark mode
  cardLabel: '#2F2A24',

  // Filter chip inactive state — more opaque than chipBg to stay visible
  filterInactiveBg:     'rgba(47,42,36,0.12)',
  filterInactiveBorder: 'rgba(47,42,36,0.20)',

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

  // Typography
  fontSerif: 'Georgia' as string,

  // System
  statusBar: 'dark-content' as 'dark-content' | 'light-content',
  retryBg: 'rgba(201,169,107,0.10)',
};

// ─── Dark — midnight navy + deep indigo + soft gold ──────────────────────────

export const DARK = {
  // Backgrounds
  bg: '#0D0F1A',
  bgAlt: '#131626',
  card: '#131626',
  cardAlt: '#1A1D32',
  cardBorder: 'transparent',
  divider: 'rgba(232,226,216,0.06)',

  // Text
  text: '#E8E2D8',
  textSub: '#B8B0A6',
  textMuted: '#7A7470',

  // Primary accent — muted sage green
  accent: '#9EB7A2',
  accentBg: 'rgba(158,183,162,0.12)',
  accentBorder: 'rgba(158,183,162,0.28)',

  // Secondary accent — soft warm gold
  gold: '#C9A96B',
  goldBg: 'rgba(201,169,107,0.12)',
  goldBorder: 'rgba(201,169,107,0.24)',
  goldText: '#C9A96B',

  // Card labels (quick-nav cards): dark in light mode, gold in dark mode
  cardLabel: '#C9A96B',

  // Filter chip inactive state — more opaque than chipBg to stay visible
  filterInactiveBg:     'rgba(232,226,216,0.12)',
  filterInactiveBorder: 'rgba(232,226,216,0.18)',

  // Inputs
  inputBg: 'rgba(232,226,216,0.04)',
  inputBorder: 'rgba(232,226,216,0.08)',

  // Filter chips
  chipBg: 'rgba(232,226,216,0.05)',
  chipBorder: 'rgba(232,226,216,0.08)',

  // Streak week circles
  weekCircleBg: 'rgba(232,226,216,0.05)',
  weekCircleBorder: 'rgba(232,226,216,0.08)',
  weekCircleActiveBg: 'rgba(201,169,107,0.14)',

  // Progress bar track
  progressTrack: 'rgba(232,226,216,0.08)',

  // Typography
  fontSerif: 'Georgia' as string,

  // System
  statusBar: 'light-content' as 'dark-content' | 'light-content',
  retryBg: 'rgba(201,169,107,0.12)',
};

export type AppTheme = typeof LIGHT;

export function useTheme(): AppTheme {
  const { pref } = useContext(AppearanceContext);
  const systemScheme = useColorScheme();
  const scheme = pref === 'system' ? systemScheme : pref;
  return scheme === 'dark' ? DARK : LIGHT;
}
