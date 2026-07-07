import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, increment, Timestamp, writeBatch,
  deleteField,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import { getDeviceId } from './notesService';
import type { Chat, ChatMessage, ChatUser, ScripturePayload, LastMessage } from '../types/chat';
import { AVATAR_COLORS } from '../types/chat';

const DISPLAY_NAME_KEY = '@chat_display_name';
const AVATAR_COLOR_KEY = '@chat_avatar_color';

// ── User profile ──────────────────────────────────────────────────────────────

export async function getOrCreateProfile(): Promise<ChatUser> {
  const userId = await getDeviceId();
  const userRef = doc(db, 'chatUsers', userId);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const d = snap.data();
    return {
      id: userId,
      displayName: d.displayName,
      initials: initials(d.displayName),
      avatarColor: d.avatarColor,
      lastSeen: d.lastSeen?.toMillis?.() ?? Date.now(),
      isOnline: true,
    };
  }

  // New user — no profile yet
  return {
    id: userId,
    displayName: '',
    initials: '?',
    avatarColor: AVATAR_COLORS[0],
    lastSeen: Date.now(),
    isOnline: true,
  };
}

export async function saveProfile(displayName: string): Promise<ChatUser> {
  const userId = await getDeviceId();
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const profile: ChatUser = {
    id: userId,
    displayName: displayName.trim(),
    initials: initials(displayName),
    avatarColor: color,
    lastSeen: Date.now(),
    isOnline: true,
  };
  await setDoc(doc(db, 'chatUsers', userId), {
    displayName: profile.displayName,
    initials: profile.initials,
    avatarColor: profile.avatarColor,
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  await AsyncStorage.setItem(DISPLAY_NAME_KEY, profile.displayName);
  await AsyncStorage.setItem(AVATAR_COLOR_KEY, color);
  return profile;
}

export async function getSavedDisplayName(): Promise<string | null> {
  return AsyncStorage.getItem(DISPLAY_NAME_KEY);
}

export async function getUserById(userId: string): Promise<ChatUser | null> {
  const snap = await getDoc(doc(db, 'chatUsers', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    displayName: d.displayName ?? 'Unknown',
    initials: initials(d.displayName ?? '?'),
    avatarColor: d.avatarColor ?? AVATAR_COLORS[0],
    lastSeen: d.lastSeen?.toMillis?.() ?? 0,
    isOnline: false,
  };
}

export async function searchUsers(query: string): Promise<ChatUser[]> {
  if (!query.trim()) return [];
  const userId = await getDeviceId();
  const q = collection(db, 'chatUsers');
  const snap = await getDocs(q);
  const lower = query.toLowerCase();
  return snap.docs
    .filter(d => d.id !== userId && d.data().displayName?.toLowerCase().includes(lower))
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName ?? 'Unknown',
        initials: initials(data.displayName ?? '?'),
        avatarColor: data.avatarColor ?? AVATAR_COLORS[0],
        lastSeen: data.lastSeen?.toMillis?.() ?? 0,
        isOnline: false,
      };
    })
    .slice(0, 20);
}

export async function updatePresence(online: boolean) {
  const userId = await getDeviceId();
  await updateDoc(doc(db, 'chatUsers', userId), {
    lastSeen: serverTimestamp(),
    isOnline: online,
  }).catch(() => {});
}

// ── Chats list ────────────────────────────────────────────────────────────────

export function subscribeToChats(
  userId: string,
  onUpdate: (chats: Chat[]) => void,
): () => void {
  const q = query(
    collection(db, 'chats'),
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(50),
  );

  return onSnapshot(q, snap => {
    const chats: Chat[] = snap.docs.map(d => docToChat(d.id, d.data()));
    onUpdate(chats);
  }, () => {});
}

export async function getOrCreateDM(otherUserId: string): Promise<string> {
  const userId = await getDeviceId();
  const chatId = [userId, otherUserId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    const [meSnap, themSnap] = await Promise.all([
      getDoc(doc(db, 'chatUsers', userId)),
      getDoc(doc(db, 'chatUsers', otherUserId)),
    ]);
    const myName = meSnap.data()?.displayName ?? 'Unknown';
    const theirName = themSnap.data()?.displayName ?? 'Unknown';

    await setDoc(chatRef, {
      type: 'dm',
      participantIds: [userId, otherUserId],
      participantNames: { [userId]: myName, [otherUserId]: theirName },
      unreadCounts: { [userId]: 0, [otherUserId]: 0 },
      typingUserIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return chatId;
}

export async function createGroup(name: string, memberIds: string[]): Promise<string> {
  const userId = await getDeviceId();
  const allMembers = [...new Set([userId, ...memberIds])];

  const namesSnaps = await Promise.all(allMembers.map(id => getDoc(doc(db, 'chatUsers', id))));
  const participantNames: Record<string, string> = {};
  namesSnaps.forEach((s, i) => {
    participantNames[allMembers[i]] = s.data()?.displayName ?? 'Unknown';
  });
  const unreadCounts: Record<string, number> = {};
  allMembers.forEach(id => { unreadCounts[id] = 0; });

  const ref = await addDoc(collection(db, 'chats'), {
    type: 'group',
    name: name.trim(),
    participantIds: allMembers,
    participantNames,
    memberIds: allMembers,
    adminIds: [userId],
    createdBy: userId,
    unreadCounts,
    typingUserIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Typing indicator ──────────────────────────────────────────────────────────

export function subscribeToTyping(
  chatId: string,
  currentUserId: string,
  onUpdate: (isOtherTyping: boolean) => void,
): () => void {
  return onSnapshot(
    doc(db, 'chats', chatId),
    snap => {
      const ids: string[] = snap.data()?.typingUserIds ?? [];
      onUpdate(ids.some(id => id !== currentUserId));
    },
    () => onUpdate(false),
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function subscribeToMessages(
  chatId: string,
  onUpdate: (msgs: ChatMessage[]) => void,
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(60),
  );

  return onSnapshot(q, snap => {
    const msgs: ChatMessage[] = snap.docs.map(d => docToMessage(d.id, chatId, d.data()));
    onUpdate(msgs);
  }, () => {});
}

export async function sendMessage(
  chatId: string,
  text: string,
  senderName: string,
  replyTo?: { id: string; text: string },
): Promise<void> {
  const userId = await getDeviceId();
  const batch = writeBatch(db);

  const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
  batch.set(msgRef, {
    senderId: userId,
    senderName,
    type: 'text',
    text: text.trim(),
    reactions: [],
    readBy: [userId],
    replyToId: replyTo?.id ?? null,
    replyToText: replyTo?.text ?? null,
    createdAt: serverTimestamp(),
  });

  const lastMsg: LastMessage = {
    text: text.trim(),
    senderId: userId,
    senderName,
    createdAt: Date.now(),
  };

  // Increment unread for all other participants
  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  const chatData = chatSnap.data();
  const participants: string[] = chatData?.participantIds ?? [];
  const unreadUpdate: Record<string, any> = {};
  participants.forEach(pid => {
    if (pid !== userId) unreadUpdate[`unreadCounts.${pid}`] = increment(1);
  });

  batch.update(doc(db, 'chats', chatId), {
    lastMessage: lastMsg,
    updatedAt: serverTimestamp(),
    ...unreadUpdate,
  });

  await batch.commit();
}

export async function sendScripture(
  chatId: string,
  senderName: string,
  scripture: ScripturePayload,
): Promise<void> {
  const userId = await getDeviceId();
  const batch = writeBatch(db);

  const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
  batch.set(msgRef, {
    senderId: userId,
    senderName,
    type: 'scripture',
    text: scripture.reference,
    scripture,
    reactions: [],
    readBy: [userId],
    replyToId: null,
    replyToText: null,
    createdAt: serverTimestamp(),
  });

  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  const participants: string[] = chatSnap.data()?.participantIds ?? [];
  const unreadUpdate: Record<string, any> = {};
  participants.forEach(pid => {
    if (pid !== userId) unreadUpdate[`unreadCounts.${pid}`] = increment(1);
  });

  batch.update(doc(db, 'chats', chatId), {
    lastMessage: { text: `📖 ${scripture.reference}`, senderId: userId, senderName, createdAt: Date.now() },
    updatedAt: serverTimestamp(),
    ...unreadUpdate,
  });

  await batch.commit();
}

export async function markRead(chatId: string): Promise<void> {
  const userId = await getDeviceId();
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCounts.${userId}`]: 0,
  }).catch(() => {});
}

export async function toggleReaction(
  chatId: string,
  messageId: string,
  emoji: string,
): Promise<void> {
  const userId = await getDeviceId();
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;

  const reactions: Array<{ emoji: string; userIds: string[] }> = snap.data().reactions ?? [];
  const existing = reactions.find(r => r.emoji === emoji);

  if (existing) {
    if (existing.userIds.includes(userId)) {
      // Remove reaction
      const updated = existing.userIds.filter(id => id !== userId);
      if (updated.length === 0) {
        await updateDoc(msgRef, { reactions: reactions.filter(r => r.emoji !== emoji) });
      } else {
        await updateDoc(msgRef, {
          reactions: reactions.map(r => r.emoji === emoji ? { ...r, userIds: updated } : r),
        });
      }
    } else {
      await updateDoc(msgRef, {
        reactions: reactions.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, userId] } : r),
      });
    }
  } else {
    await updateDoc(msgRef, {
      reactions: [...reactions, { emoji, userIds: [userId] }],
    });
  }
}

export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    text: 'This message was deleted',
    type: 'system',
    deletedAt: serverTimestamp(),
  });
}

// ── Typing ────────────────────────────────────────────────────────────────────

export async function setTyping(chatId: string, isTyping: boolean): Promise<void> {
  const userId = await getDeviceId();
  await updateDoc(doc(db, 'chats', chatId), {
    typingUserIds: isTyping ? arrayUnion(userId) : arrayRemove(userId),
  }).catch(() => {});
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function docToChat(id: string, d: any): Chat {
  return {
    id,
    type: d.type ?? 'dm',
    participantIds: d.participantIds ?? [],
    participantNames: d.participantNames ?? {},
    name: d.name,
    description: d.description,
    createdBy: d.createdBy,
    memberIds: d.memberIds,
    adminIds: d.adminIds,
    lastMessage: d.lastMessage,
    unreadCounts: d.unreadCounts ?? {},
    typingUserIds: d.typingUserIds ?? [],
    createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
    updatedAt: d.updatedAt?.toMillis?.() ?? Date.now(),
  };
}

function docToMessage(id: string, chatId: string, d: any): ChatMessage {
  return {
    id,
    chatId,
    senderId: d.senderId ?? '',
    senderName: d.senderName ?? 'Unknown',
    type: d.type ?? 'text',
    text: d.text ?? '',
    scripture: d.scripture,
    reactions: d.reactions ?? [],
    readBy: d.readBy ?? [],
    replyToId: d.replyToId,
    replyToText: d.replyToText,
    createdAt: d.createdAt?.toMillis?.() ?? Date.now(),
    deletedAt: d.deletedAt?.toMillis?.(),
  };
}
