export type Stats = {
  streak: number;
  chaptersRead: number;
  notesCreated: number;
  scriptureChats: number;
  prayersCompleted: number;
};

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export type NotificationSettings = {
  communityActivity: boolean;
  newMessages: boolean;
  prayerUpdates: boolean;
  groupActivity: boolean;
  dailyDevotions: boolean;
};

export type PrivacySettings = {
  showOnlineStatus: boolean;
  showReadingActivity: boolean;
  showFavoriteVerse: boolean;
  allowDirectMessages: boolean;
};

export type FavoriteVerse = {
  ref: string;
  text: string;
};

// ── Default values ────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  communityActivity: true,
  newMessages:       true,
  prayerUpdates:     true,
  groupActivity:     false,
  dailyDevotions:    true,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showOnlineStatus:     true,
  showReadingActivity:  false,
  showFavoriteVerse:    true,
  allowDirectMessages:  true,
};

// ── Achievement definitions ───────────────────────────────────────────────────

export function computeAchievements(stats: Stats): Achievement[] {
  return [
    {
      id: 'first_chapter',
      icon: '🌱',
      title: 'First Steps',
      description: 'Read your first chapter',
      unlocked: stats.chaptersRead >= 1,
    },
    {
      id: 'streak_7',
      icon: '📖',
      title: '7-Day Streak',
      description: 'Read for 7 consecutive days',
      unlocked: stats.streak >= 7,
    },
    {
      id: 'streak_30',
      icon: '🔥',
      title: '30-Day Streak',
      description: 'Read for 30 consecutive days',
      unlocked: stats.streak >= 30,
    },
    {
      id: 'prayer_warrior',
      icon: '🙏',
      title: 'Prayer Warrior',
      description: 'Complete 10 prayers',
      unlocked: stats.prayersCompleted >= 10,
    },
    {
      id: 'note_taker',
      icon: '📝',
      title: 'Note Taker',
      description: 'Write 5 notes',
      unlocked: stats.notesCreated >= 5,
    },
    {
      id: 'bible_explorer',
      icon: '🏆',
      title: 'Bible Explorer',
      description: 'Read 100 chapters',
      unlocked: stats.chaptersRead >= 100,
    },
  ];
}
