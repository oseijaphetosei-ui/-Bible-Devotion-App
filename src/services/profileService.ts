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
const STREAK_LONGEST_KEY    = '@profile_streak_longest';
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

export type ReadingCompletionResult = {
  streak: number;
  longestStreak: number;
  isNewRecord: boolean;
  alreadyDoneToday: boolean;
};

/**
 * Called when the user completes a reading plan day.
 * Idempotent per calendar day — safe to call multiple times.
 */
export async function recordReadingCompletion(): Promise<ReadingCompletionResult> {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const [lastDate, current, longest] = await Promise.all([
    AsyncStorage.getItem(STREAK_LAST_KEY),
    getNum(STREAK_KEY),
    getNum(STREAK_LONGEST_KEY),
  ]);

  if (lastDate === today) {
    return { streak: current, longestStreak: longest, isNewRecord: false, alreadyDoneToday: true };
  }

  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA');
  const next = lastDate === yesterday ? current + 1 : 1;
  const newLongest = Math.max(next, longest);

  await Promise.all([
    AsyncStorage.setItem(STREAK_KEY, String(next)),
    AsyncStorage.setItem(STREAK_LAST_KEY, today),
    AsyncStorage.setItem(STREAK_LONGEST_KEY, String(newLongest)),
  ]);

  return {
    streak: next,
    longestStreak: newLongest,
    isNewRecord: next > longest,
    alreadyDoneToday: false,
  };
}

export async function getStreakCount(): Promise<number> {
  return getNum(STREAK_KEY);
}

/** @deprecated Incremented on profile open; use recordReadingCompletion() from reading plan completion instead. */
export async function checkAndUpdateStreak(): Promise<number> {
  return getStreakCount();
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

// ── Extended profile fields ───────────────────────────────────────────────────

const ABOUT_KEY    = '@profile_about';
const USERNAME_KEY = '@profile_username';
const EMAIL_KEY    = '@profile_email';

export async function getAbout(): Promise<string> {
  return (await AsyncStorage.getItem(ABOUT_KEY)) ?? '';
}
export async function setAbout(bio: string): Promise<void> {
  await AsyncStorage.setItem(ABOUT_KEY, bio);
}
export async function getUsername(): Promise<string> {
  return (await AsyncStorage.getItem(USERNAME_KEY)) ?? '';
}
export async function setUsername(username: string): Promise<void> {
  await AsyncStorage.setItem(USERNAME_KEY, username);
}
export async function getEmail(): Promise<string> {
  return (await AsyncStorage.getItem(EMAIL_KEY)) ?? '';
}
export async function setEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(EMAIL_KEY, email);
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function clearLocalProfile(): Promise<void> {
  const keysToRemove = [
    JOIN_DATE_KEY, CHAPTERS_KEY, CHATS_KEY, PRAYERS_KEY,
    STREAK_KEY, STREAK_LAST_KEY, STREAK_LONGEST_KEY, FAVORITE_VERSE_KEY,
    NOTIF_SETTINGS_KEY, PRIVACY_SETTINGS_KEY,
    ABOUT_KEY, USERNAME_KEY, EMAIL_KEY,
    '@chat_display_name', '@community_prayed', '@community_joined', '@community_reacted',
    '@chat_favorites',
  ];
  await AsyncStorage.multiRemove(keysToRemove);
}
