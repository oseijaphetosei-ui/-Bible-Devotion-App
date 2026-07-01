export type PrayerStatus = 'active' | 'waiting' | 'answered' | 'ongoing';

export type PrayerCategory =
  | 'family' | 'health' | 'work' | 'school' | 'relationships'
  | 'church' | 'thanksgiving' | 'guidance' | 'healing' | 'finances'
  | 'salvation' | 'mission' | 'other';

export type BibleRef = {
  label: string;
  text: string;
};

export type AnswerReflection = {
  howAnswered: string;
  whenHappened: string;
  whatLearned: string;
};

export type Prayer = {
  id: string;
  title: string;
  content: string;
  category: PrayerCategory;
  status: PrayerStatus;
  createdAt: string;
  updatedAt: string;
  answeredAt?: string;
  bibleRef?: BibleRef;
  tags: string[];
  isFavorite: boolean;
  mood?: string;
  answerReflection?: AnswerReflection;
};

export type PrayerStats = {
  total: number;
  active: number;
  answered: number;
  waiting: number;
  ongoing: number;
  streak: number;
};
