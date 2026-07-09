// ─── Sermon Builder Types ─────────────────────────────────────────────────────

export type SermonAudience =
  | 'children_4_8'
  | 'children_9_12'
  | 'youth'
  | 'young_adults'
  | 'adults'
  | 'family'
  | 'mixed';

export const AUDIENCE_OPTIONS: {
  value: SermonAudience;
  emoji: string;
  title: string;
  subtitle: string;
}[] = [
  { value: 'children_4_8',  emoji: '👧', title: 'Children',           subtitle: 'Ages 4–8' },
  { value: 'children_9_12', emoji: '🧒', title: 'Children',           subtitle: 'Ages 9–12' },
  { value: 'youth',         emoji: '👦', title: 'Youth',               subtitle: 'Teenagers' },
  { value: 'young_adults',  emoji: '🎓', title: 'Young Adults',        subtitle: 'Ages 18–30' },
  { value: 'adults',        emoji: '👨', title: 'Adults',              subtitle: 'General congregation' },
  { value: 'family',        emoji: '👨‍👩‍👧', title: 'Family Service',     subtitle: 'All ages together' },
  { value: 'mixed',         emoji: '🌍', title: 'Mixed Congregation',  subtitle: 'Diverse audience' },
];

export const SERMON_TYPES = [
  'Expository', 'Topical', 'Textual', 'Evangelistic', 'Discipleship',
  'Revival', 'Worship', 'Encouragement', 'Prayer', 'Leadership',
  'Family', 'Marriage', 'Parenting', 'Youth Conference', "Children's Ministry",
  'Bible Study', 'Midweek Teaching', 'Communion', 'Baptism', 'Thanksgiving',
  'Missions', 'Christmas', 'Easter', 'New Year', "Mother's Day",
  "Father's Day", 'Holy Spirit', 'Spiritual Warfare', 'Faith',
  'Healing', 'Hope', 'Christian Living',
];

export const DURATION_OPTIONS = [10, 20, 30, 45, 60];

export const TONE_OPTIONS = [
  'Inspirational', 'Conversational', 'Pastoral', 'Evangelistic', 'Academic',
  "Children's Storytelling", 'Youth Motivation', 'Encouraging', 'Challenging',
  'Prophetic', 'Teaching', 'Devotional',
];

export type SermonPoint = {
  heading: string;
  scripture: string;
  explanation: string;
  illustration: string;
  application: string;
  reflectionQuestion: string;
};

export type GeneratedSermon = {
  titles: string[];
  theme: string;
  bigIdea: string;
  keyScripture: string;
  supportingScriptures: string[];
  openingPrayer: string;
  introduction: string;
  historicalBackground: string;
  mainPoints: SermonPoint[];
  practicalApplications: string[];
  reflectionQuestions: string[];
  memoryVerse: string;
  memoryVerseText: string;
  invitation: string;
  closingPrayer: string;
  worshipSuggestions: string[];
  discussionQuestions: string[];
};

export type SermonDraft = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  // Wizard inputs
  audience: SermonAudience;
  audienceLabel: string;
  sermonType: string;
  scriptures: string[];
  topic: string;
  duration: number;
  tone: string;
  // Output
  selectedTitle: string;
  generated: GeneratedSermon;
  isFavorite: boolean;
};
