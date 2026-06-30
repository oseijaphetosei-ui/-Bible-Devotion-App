import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@notif_prefs_v2';

export type NotifTime = { hour: number; minute: number };

export type NotificationPrefs = {
  masterEnabled: boolean;

  dailyVerse: {
    enabled: boolean;
    time: NotifTime;
  };

  readingPlan: {
    enabled: boolean;
    time: NotifTime;
  };

  streak: {
    enabled: boolean;
    time: NotifTime;
  };

  prayer: {
    enabled: boolean;
    time: NotifTime;
  };

  sound:    boolean;
  weekends: boolean;

  quietHours: {
    enabled: boolean;
    start: NotifTime;
    end:   NotifTime;
  };

  permissionPromptShown: boolean;
};

export const DEFAULT_PREFS: NotificationPrefs = {
  masterEnabled: false,

  dailyVerse:  { enabled: true,  time: { hour: 7,  minute: 0  } },
  readingPlan: { enabled: true,  time: { hour: 8,  minute: 0  } },
  streak:      { enabled: true,  time: { hour: 20, minute: 0  } },
  prayer:      { enabled: false, time: { hour: 12, minute: 0  } },

  sound:    true,
  weekends: true,

  quietHours: {
    enabled: true,
    start: { hour: 22, minute: 0 },
    end:   { hour: 7,  minute: 0 },
  },

  permissionPromptShown: false,
};

export async function loadPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function patchPrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const current = await loadPrefs();
  const next = { ...current, ...patch };
  await savePrefs(next);
  return next;
}

// Returns formatted time string: "7:00 AM"
export function formatTime({ hour, minute }: NotifTime): string {
  const h   = hour % 12 === 0 ? 12 : hour % 12;
  const m   = String(minute).padStart(2, '0');
  const apm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${apm}`;
}

// Returns true if a given NotifTime falls within quiet hours
export function isInQuietHours(time: NotifTime, prefs: NotificationPrefs): boolean {
  if (!prefs.quietHours.enabled) return false;
  const { start, end } = prefs.quietHours;
  const t = time.hour * 60 + time.minute;
  const s = start.hour * 60 + start.minute;
  const e = end.hour   * 60 + end.minute;
  // Quiet hours can span midnight (e.g. 22:00 → 07:00)
  if (s > e) return t >= s || t < e;
  return t >= s && t < e;
}
