import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  bibleReference?: string;
  devotionId?: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Device ID (persists across sessions, replaces anonymous auth) ────────────

const DEVICE_ID_KEY = 'devotion_device_id';
let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  cachedDeviceId = id;
  return id;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNote(id: string, data: any): Note {
  return {
    id,
    userId: data.userId ?? '',
    title: data.title ?? '',
    content: data.content ?? '',
    bibleReference: data.bibleReference ?? undefined,
    devotionId: data.devotionId ?? undefined,
    tags: data.tags ?? [],
    favorite: data.favorite ?? false,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createNote(
  payload: Pick<Note, 'title' | 'content' | 'bibleReference' | 'devotionId' | 'tags'>
): Promise<Note> {
  const userId = await getDeviceId();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'notes'), {
    userId,
    title: payload.title,
    content: payload.content,
    bibleReference: payload.bibleReference ?? null,
    devotionId: payload.devotionId ?? null,
    tags: payload.tags ?? [],
    favorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Return a locally-constructed Note — avoids a second Firestore read and
  // sidesteps the unresolved serverTimestamp sentinel that getDoc would return.
  return {
    id: ref.id,
    userId,
    title: payload.title,
    content: payload.content,
    bibleReference: payload.bibleReference ?? undefined,
    devotionId: payload.devotionId ?? undefined,
    tags: payload.tags ?? [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getNote(id: string): Promise<Note | null> {
  const snap = await getDoc(doc(db, 'notes', id));
  if (!snap.exists()) return null;
  return toNote(snap.id, snap.data());
}

export async function getNotes(): Promise<Note[]> {
  const userId = await getDeviceId();
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toNote(d.id, d.data()));
}

export async function updateNote(
  id: string,
  changes: Partial<Pick<Note, 'title' | 'content' | 'bibleReference' | 'tags' | 'favorite'>>
): Promise<void> {
  await updateDoc(doc(db, 'notes', id), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notes', id));
}

export async function toggleFavorite(note: Note): Promise<void> {
  await updateNote(note.id, { favorite: !note.favorite });
}

export async function searchNotes(keyword: string): Promise<Note[]> {
  const all = await getNotes();
  const lower = keyword.toLowerCase();
  return all.filter(
    (n) =>
      n.title.toLowerCase().includes(lower) ||
      n.content.toLowerCase().includes(lower) ||
      (n.bibleReference ?? '').toLowerCase().includes(lower) ||
      n.tags.some((t) => t.toLowerCase().includes(lower))
  );
}
