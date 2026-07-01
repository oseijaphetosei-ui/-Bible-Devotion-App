import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';
import type { NotifScreen } from '../navigation/navigationRef';

// Queued screen to navigate to once NavigationContainer becomes ready (cold start).
let _pending: NotifScreen | null = null;

// Resolve the screen to a navigation action and fire it.
// Returns false if navigation is not yet ready (nav not mounted).
function resolveAndNavigate(screen: NotifScreen): boolean {
  if (!navigationRef.isReady()) return false;

  try {
    switch (screen) {
      // ── Home-root destinations ─────────────────────────────────────────────
      case 'Home':
        navigationRef.dispatch(
          CommonActions.navigate('MainTabs', { screen: 'HomeTab' }),
        );
        break;

      // ── HomeStack screens (no required params) ─────────────────────────────
      case 'Verse':
      case 'TodayJourney':
      case 'Devotion':
      case 'PrayerJournal':
        navigationRef.dispatch(
          CommonActions.navigate('MainTabs', {
            screen: 'HomeTab',
            params: { screen },
          }),
        );
        break;

      // ── ScriptureInsights requires reference/context params that are not
      //    available from a notification payload — fall back to Home safely.
      case 'ScriptureInsights':
        navigationRef.dispatch(
          CommonActions.navigate('MainTabs', { screen: 'HomeTab' }),
        );
        break;

      // ── Unknown screen — always fall back to Home rather than crashing ─────
      default:
        navigationRef.dispatch(
          CommonActions.navigate('MainTabs', { screen: 'HomeTab' }),
        );
    }
  } catch {
    // Navigation failed (e.g. screen removed) — swallow so the app never crashes
  }

  return true;
}

/**
 * Entry point for all notification taps.
 * Navigates immediately if the NavigationContainer is ready,
 * otherwise queues the destination for cold-start flush.
 */
export function handleNotifNavigation(screen: NotifScreen): void {
  if (!resolveAndNavigate(screen)) {
    _pending = screen;
  }
}

/**
 * Call this from NavigationContainer.onReady.
 * Drains any screen that was queued during cold start before nav was mounted.
 */
export function flushPendingNavigation(): void {
  if (_pending === null) return;
  const screen = _pending;
  _pending = null;
  resolveAndNavigate(screen);
}
