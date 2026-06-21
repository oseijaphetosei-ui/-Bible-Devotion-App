import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getDeviceId } from './notesService';
import { getSavedDisplayName } from './chatService';
import type { Stats, FavoriteVerse, NotificationSettings, PrivacySettings } from '../types/profile';
import { DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_PRIVACY_SETTINGS } from '../types/profile';

// ── AsyncStorage keys ─────────────────────────────────────────────────────────
const JOIN_DATE_KEY         = '@profile_join_date';
const CHAPTERS_KEY          = '@profile_chapters_read';
const CHATS_KEY             = '@profile_scripture_chats';
const PRAYERS_KEY           = '@profile_prayers_completed';
const STREAK_KEY            = '@profile_streak';
const STREAK_LAST_KEY       = '@profile_streak_last_date'; // YYYY-MM-DD
const FAVORITE_VERSE_KEY    = '@profile_favorite_verse';
const NOTIF_SETTINGS_KEY    = '@profile_notif_settings';
const PRIVACY_SETTINGS_KEY  = '@profile_privacy_settings';

// ── Join date ─────────────────────────────────────────────────────────────────

export async function getJoinDate(): Promise<string> {
  let date = await AsyncStorage.getItem(JOIN_DATE_KEY);
  if (!date) {
    date = new Date().toISOString();
    await AsyncStorage.setItem(JOIN_DATE_KEY, date);
  }
  return date;
}

export function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function getNum(key: string): Promise<number> {
  const v = await AsyncStorage.getItem(key);
  return v ? parseInt(v, 10) : 0;
}

async function incNum(key: string): Promise<number> {
  const cur = await getNum(key);
  const next = cur + 1;
  await AsyncStorage.setItem(key, String(next));
  return next;
}

export async function getStats(notesCount?: number): Promise<Stats> {
  const [streak, chaptersRead, scriptureChats, prayersCompleted] = await Promise.all([
    getNum(STREAK_KEY),
    getNum(CHAPTERS_KEY),
    getNum(CHATS_KEY),
    getNum(PRAYERS_KEY),
  ]);

  return {
    streak,
    chaptersRead,
    notesCreated: notesCount ?? 0,
    scriptureChats,
    prayersCompleted,
  };
}

export async function incrementChaptersRead(): Promise<void> {
  await incNum(CHAPTERS_KEY);
}

export async function incrementScriptureChats(): Promise<void> {
  await incNum(CHATS_KEY);
}

export async function incrementPrayersCompleted(): Promise<void> {
  await incNum(PRAYERS_KEY);
}

// ── Streak ────────────────────────────────────────────────────────────────────

export async function checkAndUpdateStreak(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = await AsyncStorage.getItem(STREAK_LAST_KEY);
  const current  = await getNum(STREAK_KEY);

  if (lastDate === today) return current; // already counted today

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  let next: number;

  if (lastDate === yesterday) {
    next = current + 1; // continuing streak
  } else {
    next = 1; // streak broken, restart
  }

  await AsyncStorage.setItem(STREAK_KEY, String(next));
  await AsyncStorage.setItem(STREAK_LAST_KEY, today);
  return next;
}

// ── Favorite verse ────────────────────────────────────────────────────────────

export async function getFavoriteVerse(): Promise<FavoriteVerse | null> {
  const raw = await AsyncStorage.getItem(FAVORITE_VERSE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setFavoriteVerse(verse: FavoriteVerse): Promise<void> {
  await AsyncStorage.setItem(FAVORITE_VERSE_KEY, JSON.stringify(verse));
  try {
    const uid = await getDeviceId();
    await setDoc(doc(db, 'favorites', uid), { favoriteVerse: verse, updatedAt: Timestamp.now() }, { merge: true });
  } catch { /* offline */ }
}

// ── Notification settings ─────────────────────────────────────────────────────

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(NOTIF_SETTINGS_KEY);
  return raw ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_SETTINGS;
}

export async function setNotificationSettings(s: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(s));
  try {
    const uid = await getDeviceId();
    await setDoc(doc(db, 'notificationSettings', uid), { ...s, updatedAt: Timestamp.now() }, { merge: true });
  } catch { /* offline */ }
}

// ── Privacy settings ──────────────────────────────────────────────────────────

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const raw = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
  return raw ? { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(raw) } : DEFAULT_PRIVACY_SETTINGS;
}

export async function setPrivacySettings(s: PrivacySettings): Promise<void> {
  await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(s));
  try {
    const uid = await getDeviceId();
    await setDoc(doc(db, 'privacySettings', uid), { ...s, updatedAt: Timestamp.now() }, { merge: true });
  } catch { /* offline */ }
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function clearLocalProfile(): Promise<void> {
  const keysToRemove = [
    JOIN_DATE_KEY, CHAPTERS_KEY, CHATS_KEY, PRAYERS_KEY,
    STREAK_KEY, STREAK_LAST_KEY, FAVORITE_VERSE_KEY,
    NOTIF_SETTINGS_KEY, PRIVACY_SETTINGS_KEY,
    '@chat_display_name', '@community_prayed', '@community_joined', '@community_reacted',
    '@chat_favorites',
  ];
  await AsyncStorage.multiRemove(keysToRemove);
}
