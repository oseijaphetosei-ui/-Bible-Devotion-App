import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebaseConfig';
import { getDeviceId } from './notesService';
import type { ScriptureChat, ChatMessage, ScriptureChatNavParams } from '../types/scriptureChat';

// ─── Firestore helpers ────────────────────────────────────────────────────────

function toChat(id: string, data: any): ScriptureChat {
  return {
    id,
    userId: data.userId ?? '',
    reference: data.reference ?? '',
    contextType: data.contextType ?? 'verse',
    context: data.context ?? '',
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    messages: (data.messages ?? []).map((m: any) => ({
      id: m.id ?? '',
      role: m.role ?? 'user',
      content: m.content ?? '',
      timestamp: m.timestamp ?? new Date().toISOString(),
    })),
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createChat(params: ScriptureChatNavParams): Promise<string> {
  const userId = await getDeviceId();
  const ref = await addDoc(collection(db, 'scriptureChats'), {
    userId,
    reference: params.reference,
    contextType: params.contextType,
    context: params.context,
    messages: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getChat(chatId: string): Promise<ScriptureChat | null> {
  const snap = await getDoc(doc(db, 'scriptureChats', chatId));
  if (!snap.exists()) return null;
  return toChat(snap.id, snap.data());
}

export async function getUserChats(): Promise<ScriptureChat[]> {
  const userId = await getDeviceId();
  const q = query(
    collection(db, 'scriptureChats'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toChat(d.id, d.data()));
}

export async function saveMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
  await updateDoc(doc(db, 'scriptureChats', chatId), { messages });
}

// ─── AI request ───────────────────────────────────────────────────────────────

export async function askScripture(
  reference: string,
  context: string,
  messages: ChatMessage[],
): Promise<string> {
  const fn = httpsCallable<
    { reference: string; context: string; messages: { role: string; content: string }[] },
    { content: string }
  >(functions, 'askScripture');

  const result = await fn({
    reference,
    context,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return result.data.content ?? '';
}
