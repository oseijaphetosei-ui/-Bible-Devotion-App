import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import type { AppRootParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<AppRootParamList>();

export type NotifScreen = 'Verse' | 'TodayJourney' | 'Devotion';

export function navigateFromNotification(screen: NotifScreen) {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate('MainTabs', {
      screen: 'HomeTab',
      params: { screen },
    })
  );
}
