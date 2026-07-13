import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { getDeviceId } from './notesService';
import { BUNDLED_STUDIES } from '../data/studies';
import type {
  Study, StudyProgress, StudyLesson, LessonLockState, JourneySnapshot,
} from '../types/study';

// Local-first: AsyncStorage is the source of truth for instant, offline access.
// Firestore mirrors progress for cross-device sync — pushed on every change,
// pulled (and merged) once per app session.

const PROGRESS_KEY      = '@study_progress_v1';   // Record<studyId, StudyProgress>
const ACTIVE_STUDY_KEY  = '@study_active_v1';     // studyId
const REMOTE_CACHE_KEY  = '@study_remote_v1';     // { fetchedAt: number; studies: Study[] }
const REMOTE_TTL_MS     = 24 * 60 * 60 * 1000;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── Study catalog (bundled + remote) ──────────────────────────────────────────

let remoteStudies: Study[] = [];

/** Bundled studies plus any published to the Firestore `studies` collection. */
export function getAllStudies(): Study[] {
  const bundledIds = new Set(BUNDLED_STUDIES.map(s => s.id));
  return [...BUNDLED_STUDIES, ...remoteStudies.filter(s => !bundledIds.has(s.id))];
}

export function getStudyById(id: string): Study | undefined {
  return getAllStudies().find(s => s.id === id);
}

function isValidStudy(s: any): s is Study {
  return s && typeof s.id === 'string' && typeof s.title === 'string'
    && Array.isArray(s.lessons) && s.lessons.length > 0
    && typeof s.totalDays === 'number';
}

/**
 * Load remote studies: from AsyncStorage cache instantly, refreshing from
 * Firestore at most once per 24h. New studies ship with no app update.
 */
export async function loadRemoteStudies(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { fetchedAt: number; studies: Study[] };
      remoteStudies = (cached.studies ?? []).filter(isValidStudy);
      if (Date.now() - cached.fetchedAt < REMOTE_TTL_MS) return;
    }
  } catch { /* fall through to network */ }

  try {
    const snap = await getDocs(collection(db, 'studies'));
    const studies = snap.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .filter(isValidStudy);
    remoteStudies = studies;
    await AsyncStorage.setItem(
      REMOTE_CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), studies }),
    );
  } catch { /* offline — keep whatever cache produced */ }
}

// ── Progress: local persistence ───────────────────────────────────────────────

async function getAllProgress(): Promise<Record<string, StudyProgress>> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveAllProgress(all: Record<string, StudyProgress>): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  syncToFirestore(all); // fire-and-forget
}

export async function getProgress(studyId: string): Promise<StudyProgress | null> {
  const all = await getAllProgress();
  return all[studyId] ?? null;
}

export async function getActiveStudyId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_STUDY_KEY);
}

// ── Progress: actions ─────────────────────────────────────────────────────────

export async function startStudy(studyId: string): Promise<StudyProgress> {
  const all = await getAllProgress();
  // Resume rather than reset if the user already has progress
  const existing = all[studyId];
  if (existing && !existing.finished) {
    await AsyncStorage.setItem(ACTIVE_STUDY_KEY, studyId);
    return existing;
  }
  const progress: StudyProgress = {
    studyId,
    startDate: new Date().toISOString(),
    currentDay: 1,
    completedDays: [],
    lastCompletedDate: null,
    completionTimes: {},
    finished: false,
  };
  all[studyId] = progress;
  await AsyncStorage.setItem(ACTIVE_STUDY_KEY, studyId);
  await saveAllProgress(all);
  return progress;
}

export async function completeLesson(studyId: string, day: number): Promise<StudyProgress> {
  const all = await getAllProgress();
  const current = all[studyId];
  if (!current) throw new Error('Study not started');

  const study = getStudyById(studyId);
  const totalDays = study?.totalDays ?? day;

  if (!current.completedDays.includes(day)) {
    current.completedDays = [...current.completedDays, day];
    current.completionTimes = { ...current.completionTimes, [String(day)]: new Date().toISOString() };
  }
  current.lastCompletedDate = todayKey();
  current.currentDay = Math.min(day + 1, totalDays);
  if (current.completedDays.length >= totalDays) {
    current.finished = true;
    current.finishedDate = current.finishedDate ?? new Date().toISOString();
  }

  all[studyId] = { ...current };
  await saveAllProgress(all);
  return all[studyId];
}

// ── Lesson locking ────────────────────────────────────────────────────────────
// Completed lessons stay open forever. The current lesson is available. After
// completing today's lesson, the next unlocks tomorrow — one lesson per day.

export function getLockState(progress: StudyProgress | null, day: number): LessonLockState {
  if (!progress) return day === 1 ? 'available' : 'locked';
  if (progress.completedDays.includes(day)) return 'completed';
  if (day === progress.currentDay) {
    return progress.lastCompletedDate === todayKey() ? 'tomorrow' : 'available';
  }
  return 'locked';
}

// ── Streak ────────────────────────────────────────────────────────────────────
// Consecutive-day streak computed from completion timestamps across all studies.

export function computeStreak(all: Record<string, StudyProgress>): number {
  const days = new Set<string>();
  for (const p of Object.values(all)) {
    for (const iso of Object.values(p.completionTimes)) {
      days.add(iso.slice(0, 10));
    }
  }
  if (days.size === 0) return 0;

  // Streak counts back from today (or yesterday, if today isn't done yet)
  let cursor = days.has(todayKey()) ? todayKey() : yesterdayKey();
  if (!days.has(cursor)) return 0;

  let streak = 0;
  const d = new Date(cursor);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ── Journey snapshot (drives Home card + Journey dashboard) ───────────────────

export async function getJourneySnapshot(): Promise<JourneySnapshot | null> {
  const activeId = await getActiveStudyId();
  if (!activeId) return null;
  const study = getStudyById(activeId);
  if (!study) return null;
  const all = await getAllProgress();
  const progress = all[activeId];
  if (!progress) return null;

  const todayLesson = study.lessons.find(l => l.day === progress.currentDay) ?? null;
  const doneForToday = progress.lastCompletedDate === todayKey()
    && !progress.completedDays.includes(progress.currentDay);

  return {
    study,
    progress,
    todayLesson,
    doneForToday,
    percent: study.totalDays > 0 ? progress.completedDays.length / study.totalDays : 0,
    streak: computeStreak(all),
  };
}

export function estimatedFinishDate(study: Study, progress: StudyProgress): string {
  const remaining = study.totalDays - progress.completedDays.length;
  const d = new Date();
  d.setDate(d.getDate() + Math.max(remaining - (progress.lastCompletedDate === todayKey() ? 0 : 1), 0));
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// ── Firestore sync ────────────────────────────────────────────────────────────

async function ensureAuth(): Promise<void> {
  if (!auth.currentUser) await signInAnonymously(auth);
}

async function syncToFirestore(all: Record<string, StudyProgress>): Promise<void> {
  try {
    await ensureAuth();
    const deviceId = await getDeviceId();
    const activeStudyId = await AsyncStorage.getItem(ACTIVE_STUDY_KEY);
    await setDoc(doc(db, 'studyProgress', deviceId), {
      progress: all,
      activeStudyId: activeStudyId ?? null,
      updatedAt: new Date().toISOString(),
    });
  } catch { /* offline — local copy is authoritative; next change re-syncs */ }
}

/**
 * Pull remote progress once per session and merge: for each study, whichever
 * side has more completed lessons wins. Call on Journey dashboard mount.
 */
let pulledThisSession = false;
export async function pullRemoteProgress(): Promise<void> {
  if (pulledThisSession) return;
  pulledThisSession = true;
  try {
    await ensureAuth();
    const deviceId = await getDeviceId();
    const snap = await getDoc(doc(db, 'studyProgress', deviceId));
    if (!snap.exists()) return;

    const remote = (snap.data().progress ?? {}) as Record<string, StudyProgress>;
    const local  = await getAllProgress();
    let changed = false;

    for (const [id, rp] of Object.entries(remote)) {
      const lp = local[id];
      if (!lp || rp.completedDays.length > lp.completedDays.length) {
        local[id] = rp;
        changed = true;
      }
    }
    if (changed) {
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(local));
      const remoteActive = snap.data().activeStudyId as string | null;
      const localActive  = await AsyncStorage.getItem(ACTIVE_STUDY_KEY);
      if (!localActive && remoteActive) {
        await AsyncStorage.setItem(ACTIVE_STUDY_KEY, remoteActive);
      }
    }
  } catch { /* offline — fine */ }
}
