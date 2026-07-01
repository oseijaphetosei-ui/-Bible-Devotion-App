import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrimaryGoal = 'devotion' | 'study' | 'prayer' | 'reading';

export type OnboardingData = {
  onboardingCompleted: boolean;
  primaryGoal: PrimaryGoal | null;
  preferredBibleTranslation: string;
  reminderTime: { hour: number; minute: number } | null;
};

const KEY = '@onboarding_v1';

const DEFAULT: OnboardingData = {
  onboardingCompleted: false,
  primaryGoal: null,
  preferredBibleTranslation: 'KJV',
  reminderTime: null,
};

export async function loadOnboarding(): Promise<OnboardingData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export async function saveOnboarding(patch: Partial<OnboardingData>): Promise<void> {
  try {
    const current = await loadOnboarding();
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}

export async function completeOnboarding(data: Omit<OnboardingData, 'onboardingCompleted'>): Promise<void> {
  await saveOnboarding({ ...data, onboardingCompleted: true });
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const data = await loadOnboarding();
  return data.onboardingCompleted;
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
