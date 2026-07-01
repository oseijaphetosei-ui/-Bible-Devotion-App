import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { AppRootParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<AppRootParamList>();

export type NotifScreen =
  | 'Home'
  | 'Verse'
  | 'TodayJourney'
  | 'Devotion'
  | 'PrayerJournal'
  | 'ScriptureInsights';

export function navigateToNotificationSettings() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate('ProfileModal', { screen: 'Notifications' })
  );
}
