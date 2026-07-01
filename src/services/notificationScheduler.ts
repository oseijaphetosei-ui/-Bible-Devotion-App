import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationPrefs } from './notificationPreferences';
import { isInQuietHours } from './notificationPreferences';
import {
  pickVerseTemplate,
  pickReadingTemplate,
  pickStreakTemplate,
  pickPrayerTemplate,
} from './notificationTemplates';
import type { NotifScreen } from '../navigation/navigationRef';

// ─── Stable identifiers — cancel/reschedule by ID without duplicates ──────────
export const NOTIF_ID = {
  verse:   'notif.verse',
  reading: 'notif.reading',
  streak:  'notif.streak',
  prayer:  'notif.prayer',
} as const;

// ─── Android channel (one-time setup) ────────────────────────────────────────

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name:               'Daily Devotion',
    importance:         Notifications.AndroidImportance.DEFAULT,
    vibrationPattern:   [0, 200],
    lightColor:         '#C9A96B',
    enableVibrate:      true,
    showBadge:          false,
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function makeContent(
  payload: { title: string; body: string },
  screen: NotifScreen,
  sound: boolean,
) {
  return {
    title:            payload.title,
    body:             payload.body,
    sound:            sound,
    data:             { screen } satisfies { screen: NotifScreen },
    categoryIdentifier: screen,
  };
}

async function scheduleDaily(
  id: string,
  content: ReturnType<typeof makeContent>,
  hour: number,
  minute: number,
) {
  // Cancel any existing schedule for this ID first
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content,
    trigger: {
      type:   Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ─── Individual schedulers ────────────────────────────────────────────────────

export async function scheduleDailyVerse(prefs: NotificationPrefs) {
  const { enabled, time } = prefs.dailyVerse;
  if (!prefs.masterEnabled || !enabled || isInQuietHours(time, prefs)) {
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID.verse).catch(() => {});
    return;
  }
  const payload = pickVerseTemplate();
  const content = makeContent(payload, 'Verse', prefs.sound);
  await scheduleDaily(NOTIF_ID.verse, content, time.hour, time.minute);
}

export async function scheduleReadingReminder(
  prefs: NotificationPrefs,
  activePlan: { planName: string; currentDay: number; estimatedMinutes: number } | null,
  todayCompleted: boolean,
) {
  const { enabled, time } = prefs.readingPlan;

  // Don't remind if: disabled, no active plan, or already completed today
  if (!prefs.masterEnabled || !enabled || !activePlan || todayCompleted || isInQuietHours(time, prefs)) {
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID.reading).catch(() => {});
    return;
  }

  const payload = pickReadingTemplate(
    activePlan.planName,
    activePlan.currentDay,
    activePlan.estimatedMinutes,
  );
  const content = makeContent(payload, 'TodayJourney', prefs.sound);
  await scheduleDaily(NOTIF_ID.reading, content, time.hour, time.minute);
}

export async function scheduleStreakReminder(
  prefs: NotificationPrefs,
  streak: number,
  todayCompleted: boolean,
) {
  const { enabled, time } = prefs.streak;

  // Only send if there's an active streak and today isn't complete yet
  if (!prefs.masterEnabled || !enabled || streak < 1 || todayCompleted || isInQuietHours(time, prefs)) {
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID.streak).catch(() => {});
    return;
  }

  const payload = pickStreakTemplate(streak);
  const content = makeContent(payload, 'Home', prefs.sound);
  await scheduleDaily(NOTIF_ID.streak, content, time.hour, time.minute);
}

export async function schedulePrayerReminder(prefs: NotificationPrefs) {
  const { enabled, time } = prefs.prayer;
  if (!prefs.masterEnabled || !enabled || isInQuietHours(time, prefs)) {
    await Notifications.cancelScheduledNotificationAsync(NOTIF_ID.prayer).catch(() => {});
    return;
  }
  const payload = pickPrayerTemplate();
  const content = makeContent(payload, 'PrayerJournal', prefs.sound);
  await scheduleDaily(NOTIF_ID.prayer, content, time.hour, time.minute);
}

export async function cancelAll() {
  await Promise.all(
    Object.values(NOTIF_ID).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
}
