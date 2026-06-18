import { useColorScheme } from 'react-native';

export const LIGHT = {
  // Backgrounds
  bg: '#F8F5EE',
  bgAlt: '#EEE8D9',
  card: '#FFFFFF',
  cardAlt: '#F5F0E8',
  cardBorder: 'rgba(0,0,0,0.07)',
  divider: 'rgba(0,0,0,0.07)',

  // Text
  text: '#1C1917',
  textSub: '#6B6560',
  textMuted: '#9E9991',

  // Gold — darker for readability on light bg
  gold: '#8B6914',
  goldBg: 'rgba(184,134,11,0.09)',
  goldBorder: 'rgba(184,134,11,0.28)',
  goldText: '#8B6914',

  // Inputs
  inputBg: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(0,0,0,0.1)',

  // Filter chips
  chipBg: 'rgba(0,0,0,0.05)',
  chipBorder: 'rgba(0,0,0,0.09)',

  // Streak week circles
  weekCircleBg: 'rgba(0,0,0,0.06)',
  weekCircleBorder: 'rgba(0,0,0,0.09)',
  weekCircleActiveBg: 'rgba(184,134,11,0.14)',

  // Progress bar track
  progressTrack: 'rgba(0,0,0,0.09)',

  // System
  statusBar: 'dark-content' as 'dark-content' | 'light-content',
  retryBg: 'rgba(184,134,11,0.1)',
};

export const DARK = {
  // Backgrounds
  bg: '#0F172A',
  bgAlt: '#1E293B',
  card: '#1E293B',
  cardAlt: '#162032',
  cardBorder: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.07)',

  // Text
  text: '#F1F5F9',
  textSub: '#94A3B8',
  textMuted: '#475569',

  // Gold
  gold: '#D4AF37',
  goldBg: 'rgba(212,175,55,0.12)',
  goldBorder: 'rgba(212,175,55,0.35)',
  goldText: '#D4AF37',

  // Inputs
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.1)',

  // Filter chips
  chipBg: 'rgba(255,255,255,0.05)',
  chipBorder: 'rgba(255,255,255,0.1)',

  // Streak week circles
  weekCircleBg: 'rgba(255,255,255,0.05)',
  weekCircleBorder: 'rgba(255,255,255,0.08)',
  weekCircleActiveBg: 'rgba(212,175,55,0.13)',

  // Progress bar track
  progressTrack: 'rgba(255,255,255,0.09)',

  // System
  statusBar: 'light-content' as 'dark-content' | 'light-content',
  retryBg: 'rgba(212,175,55,0.15)',
};

export type AppTheme = typeof LIGHT;

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}
