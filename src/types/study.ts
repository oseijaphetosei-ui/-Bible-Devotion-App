// ── Structured Bible Journey (Daily Devotion redesign) ────────────────────────
// A Study is a multi-day guided journey; each Lesson is one day's devotion.
// Studies are data-driven: bundled ones live in src/data/studies.ts, and new
// studies can be added to the Firestore `studies` collection with no app update.

export type StudyCategory =
  | 'jesus' | 'prayer' | 'faith' | 'hope' | 'wisdom'
  | 'characters' | 'old-testament' | 'new-testament'
  | 'peace' | 'growth' | 'living';

export const STUDY_CATEGORY_LABELS: Record<StudyCategory, string> = {
  jesus:           'Following Jesus',
  prayer:          'Prayer',
  faith:           'Faith',
  hope:            'Hope',
  wisdom:          'Wisdom',
  characters:      'Bible Characters',
  'old-testament': 'Old Testament',
  'new-testament': 'New Testament',
  peace:           'Peace & Anxiety',
  growth:          'Spiritual Growth',
  living:          'Christian Living',
};

export type ScriptureRef = {
  /** Display label, e.g. "Matthew 5:3-12" */
  label: string;
  /** Index into the KJV book array — powers "Read Full Chapter" navigation */
  bookIndex: number;
  chapter: number;
};

export type StudyLesson = {
  day: number;
  title: string;
  /** One-line hook shown in timelines and previews */
  subtitle: string;
  openingPrayer: string;
  memoryVerse: { reference: string; text: string };
  /** Main passage + short excerpt printed in the reader */
  passage: ScriptureRef & { excerpt: string };
  context: string;
  /** 2–3 short paragraphs of teaching */
  teaching: string[];
  application: string;
  reflectionQuestions: string[];
  closingPrayer: string;
  challenge: string;
  keyTakeaway: string;
  /** Tomorrow's teaser — omitted on the final lesson */
  tomorrowPreview?: string;
  readingMinutes: number;
};

export type Study = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: StudyCategory;
  totalDays: number;
  readingMinutes: number;
  /** Dark gradient pair for the cover card */
  gradient: [string, string];
  icon: string;
  lessons: StudyLesson[];
};

// ── Progress ──────────────────────────────────────────────────────────────────

export type StudyProgress = {
  studyId: string;
  startDate: string;            // ISO
  currentDay: number;           // 1-based; next lesson to take
  completedDays: number[];
  lastCompletedDate: string | null; // YYYY-MM-DD
  /** day → ISO completion timestamp */
  completionTimes: Record<string, string>;
  finished: boolean;
  finishedDate?: string;
};

export type LessonLockState = 'completed' | 'available' | 'tomorrow' | 'locked';

export type JourneySnapshot = {
  study: Study;
  progress: StudyProgress;
  todayLesson: StudyLesson | null;
  /** True when today's lesson is done and the next unlocks tomorrow */
  doneForToday: boolean;
  percent: number;              // 0..1
  streak: number;
};
