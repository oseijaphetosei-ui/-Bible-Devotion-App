import {
  collection, doc, addDoc, updateDoc,
  getDocs, getDoc, deleteDoc, query, where, orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getDeviceId } from './notesService';
import { generateSermon as generateSermonApi } from './appApi';
import type { SermonDraft, GeneratedSermon, SermonAudience } from '../types/sermon';

const COLLECTION = 'sermons';

export async function generateSermon(input: {
  audience: SermonAudience;
  audienceLabel: string;
  sermonType: string;
  scriptures: string[];
  topic: string;
  duration: number;
  tone: string;
}): Promise<GeneratedSermon> {
  return generateSermonApi(input);
}

export async function saveSermon(
  data: Omit<SermonDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
): Promise<SermonDraft> {
  const userId = await getDeviceId();
  const now = new Date().toISOString();
  const payload = { ...data, userId, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { ...payload, id: ref.id };
}

export async function getSermons(): Promise<SermonDraft[]> {
  const userId = await getDeviceId();
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SermonDraft));
}

export async function getSermon(id: string): Promise<SermonDraft | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SermonDraft;
}

export async function toggleSermonFavorite(sermon: SermonDraft): Promise<void> {
  await updateDoc(doc(db, COLLECTION, sermon.id), {
    isFavorite: !sermon.isFavorite,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSermon(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
