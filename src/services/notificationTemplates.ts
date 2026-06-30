export type NotifPayload = { title: string; body: string };

// ─── Daily Verse ─────────────────────────────────────────────────────────────

const VERSE_TEMPLATES: NotifPayload[] = [
  { title: "God's Word is waiting",    body: "Start your day with today's Scripture." },
  { title: "Today's verse is ready",   body: "A new word from God awaits you." },
  { title: "Good morning",             body: "Begin your day grounded in Scripture." },
  { title: "Your daily verse",         body: "Take a moment with God's Word today." },
  { title: "A new day, a new verse",   body: "Today's Scripture is ready for you." },
  { title: "Open your heart",          body: "God has something for you today." },
  { title: "Morning with the Word",    body: "Your daily Scripture reading is ready." },
  { title: "Start well today",         body: "Spend a quiet moment with today's verse." },
  { title: "Daily Scripture",          body: "Today's verse is here whenever you're ready." },
  { title: "A word for today",         body: "Your daily reading is waiting." },
];

// ─── Reading Plan ─────────────────────────────────────────────────────────────

const READING_TEMPLATES: Array<(planName: string, day: number, minutes: number) => NotifPayload> = [
  (plan, day, min) => ({
    title: `Day ${day} is ready`,
    body: `Continue your journey through ${plan}. About ${min} min.`,
  }),
  (plan, day, min) => ({
    title: 'Continue your reading plan',
    body: `Day ${day} of ${plan} — only ${min} minutes today.`,
  }),
  (_, day, min) => ({
    title: `${min} minutes with Scripture`,
    body: `Day ${day} of your reading plan is waiting for you.`,
  }),
  (plan, day) => ({
    title: 'Keep the momentum',
    body: `Day ${day} of ${plan} — pick up where you left off.`,
  }),
  (_, day, min) => ({
    title: 'Your reading plan',
    body: `Day ${day} · ${min} min · Your journey continues today.`,
  }),
  (plan) => ({
    title: 'A few minutes with God',
    body: `Continue ${plan} — a little each day goes a long way.`,
  }),
  (_, day) => ({
    title: "Today's reading",
    body: `Day ${day} is ready whenever you are.`,
  }),
];

// ─── Streak Protection ────────────────────────────────────────────────────────

const STREAK_TEMPLATES: Array<(streak: number) => NotifPayload> = [
  (n) => ({
    title: `${n}-day streak`,
    body: "Keep your habit alive — a few minutes is all it takes.",
  }),
  (n) => ({
    title: "Your streak is waiting",
    body: `You've been consistent for ${n} days. Continue today.`,
  }),
  (n) => ({
    title: `${n} days of Scripture`,
    body: "One more day to keep the momentum going.",
  }),
  () => ({
    title: "Stay on track",
    body: "Your daily Scripture habit is worth protecting.",
  }),
  (n) => ({
    title: "Your journey continues",
    body: `${n} days in — don't stop now. A moment is enough.`,
  }),
  (n) => ({
    title: `${n} days strong`,
    body: "Spend a few minutes with God today to keep your streak.",
  }),
];

// ─── Prayer Reminder ──────────────────────────────────────────────────────────

const PRAYER_TEMPLATES: NotifPayload[] = [
  { title: "A moment of prayer",      body: "Pause and spend a few moments with God." },
  { title: "Time to pray",            body: "Take a quiet moment to bring your heart to God." },
  { title: "Prayer time",             body: "A few minutes of prayer can change your whole day." },
  { title: "Be still",                body: "Take a breath, quiet your heart, and pray." },
  { title: "Reconnect with God",      body: "A gentle pause for prayer is waiting." },
  { title: "Your prayer reminder",    body: "Spend a quiet moment in conversation with God." },
  { title: "Come as you are",         body: "God is listening. Take a moment to pray." },
  { title: "Quiet your heart",        body: "A few moments of stillness and prayer await." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickVerseTemplate(): NotifPayload {
  return pick(VERSE_TEMPLATES);
}

export function pickReadingTemplate(
  planName: string,
  day: number,
  estimatedMinutes: number,
): NotifPayload {
  return pick(READING_TEMPLATES)(planName, day, estimatedMinutes);
}

export function pickStreakTemplate(streak: number): NotifPayload {
  return pick(STREAK_TEMPLATES)(streak);
}

export function pickPrayerTemplate(): NotifPayload {
  return pick(PRAYER_TEMPLATES);
}
