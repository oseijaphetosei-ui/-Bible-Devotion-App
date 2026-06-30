import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import {
  loadPrefs,
  savePrefs,
  patchPrefs,
  type NotificationPrefs,
} from './notificationPreferences';
import {
  ensureAndroidChannel,
  scheduleDailyVerse,
  scheduleReadingReminder,
  scheduleStreakReminder,
  schedulePrayerReminder,
  cancelAll,
} from './notificationScheduler';
import { getActivePlan, getPlanById, getTodayReading, isTodayCompleted } from './readingPlanService';
import { navigateFromNotification, type NotifScreen } from '../navigation/navigationRef';

// ─── Foreground notification behaviour ───────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// ─── Permission ───────────────────────────────────────────────────────────────

type PermsResult = { status: string; canAskAgain: boolean };

export async function checkPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const perms = await Notifications.getPermissionsAsync() as unknown as PermsResult;
  if (perms.status === 'granted') return 'granted';
  if (perms.canAskAgain) return 'undetermined';
  return 'denied';
}

export async function requestPermission(): Promise<boolean> {
  const current = await checkPermissionStatus();
  if (current === 'granted') return true;
  if (current === 'denied') return false;
  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  }) as unknown as PermsResult;
  return result.status === 'granted';
}

// Show a one-time contextual prompt before the OS permission dialog.
// Called after the user has completed their first devotion or started a plan.
export async function maybePromptPermission(): Promise<void> {
  const prefs = await loadPrefs();
  if (prefs.permissionPromptShown) return;

  const status = await checkPermissionStatus();
  if (status === 'granted') {
    await patchPrefs({ permissionPromptShown: true, masterEnabled: true });
    await rescheduleAll();
    return;
  }
  if (status === 'denied') {
    await patchPrefs({ permissionPromptShown: true });
    return;
  }

  // Show our own explanation first
  await new Promise<void>((resolve) => {
    Alert.alert(
      'Stay connected to Scripture',
      "Would you like a gentle daily reminder to spend time in God's Word? You can change this anytime.",
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: async () => {
            await patchPrefs({ permissionPromptShown: true });
            resolve();
          },
        },
        {
          text: 'Enable reminders',
          onPress: async () => {
            await patchPrefs({ permissionPromptShown: true });
            const granted = await requestPermission();
            if (granted) {
              await patchPrefs({ masterEnabled: true });
              await rescheduleAll();
            }
            resolve();
          },
        },
      ],
    );
  });
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export async function rescheduleAll(overridePrefs?: NotificationPrefs): Promise<void> {
  const prefs = overridePrefs ?? await loadPrefs();

  if (!prefs.masterEnabled) {
    await cancelAll();
    return;
  }

  const granted = await checkPermissionStatus();
  if (granted !== 'granted') {
    await cancelAll();
    return;
  }

  await ensureAndroidChannel();

  // Resolve live plan state for smart scheduling
  const activePlan  = await getActivePlan().catch(() => null);
  const plan        = activePlan ? getPlanById(activePlan.planId) : null;
  const todayDone   = activePlan ? isTodayCompleted(activePlan) : false;
  const readingInfo = (activePlan && plan)
    ? {
        planName:          plan.title,
        currentDay:        activePlan.currentDay,
        estimatedMinutes:  getTodayReading(activePlan)?.estimatedMinutes ?? 5,
      }
    : null;

  await Promise.all([
    scheduleDailyVerse(prefs),
    scheduleReadingReminder(prefs, readingInfo, todayDone),
    scheduleStreakReminder(prefs, activePlan?.streak ?? 0, todayDone),
    schedulePrayerReminder(prefs),
  ]);
}

// ─── Deep link handler ────────────────────────────────────────────────────────

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const screen = response.notification.request.content.data?.screen as NotifScreen | undefined;
  if (screen) navigateFromNotification(screen);
}

// ─── Initialization (call once in App) ───────────────────────────────────────

let _responseListener: Notifications.EventSubscription | null = null;
let _foregroundListener: Notifications.EventSubscription | null = null;

export function initializeNotifications(): () => void {
  if (Platform.OS !== 'web') ensureAndroidChannel();

  // Handle taps on notifications (app in background/killed)
  _responseListener = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );

  // Log foreground notifications in dev (already shown as alert via handler above)
  if (__DEV__) {
    _foregroundListener = Notifications.addNotificationReceivedListener((n) => {
      console.log('[Notifications] received in foreground:', n.request.identifier);
    });
  }

  // Also handle notification that launched the app (app was killed)
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleNotificationResponse(response);
  });

  // Reschedule on startup — iOS clears scheduled notifications after device reboot
  rescheduleAll().catch(() => {});

  return () => {
    _responseListener?.remove();
    _foregroundListener?.remove();
  };
}
