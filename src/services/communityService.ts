import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, increment, Timestamp, writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import { getDeviceId } from './notesService';
import type { Post, Comment, Group, PostType, ReactionType } from '../types/community';
import { SAMPLE_POSTS, SAMPLE_GROUPS, SAMPLE_COMMENTS } from '../types/community';
import { AVATAR_COLORS } from '../types/chat';
import { getSavedDisplayName } from './chatService';

const PRAYED_KEY = '@community_prayed'; // Set<postId>
const JOINED_KEY = '@community_joined'; // Set<groupId>
const REACTED_KEY = '@community_reacted'; // { [postId]: ReactionType }

// ── Helpers ───────────────────────────────────────────────────────────────────

function docToPost(id: string, d: any, userReaction?: ReactionType, userPraying?: boolean): Post {
  return {
    id,
    authorId:    d.authorId ?? '',
    authorName:  d.authorName ?? 'Anonymous',
    authorColor: d.authorColor ?? AVATAR_COLORS[0],
    type:        d.type ?? 'post',
    content:     d.content ?? '',
    scriptureRef: d.scriptureRef,
    category:    d.category,
    reactions: {
      love:     d.reactions?.love     ?? 0,
      praying:  d.reactions?.praying  ?? 0,
      inspired: d.reactions?.inspired ?? 0,
      amen:     d.reactions?.amen     ?? 0,
      helpful:  d.reactions?.helpful  ?? 0,
    },
    userReaction,
    commentCount: d.commentCount ?? 0,
    prayerCount:  d.prayerCount  ?? 0,
    userPraying,
    createdAt: d.createdAt?.toMillis?.() ?? d.createdAt ?? Date.now(),
    answered:  d.answered,
  };
}

function docToComment(id: string, d: any): Comment {
  return {
    id,
    postId:     d.postId ?? '',
    authorId:   d.authorId ?? '',
    authorName: d.authorName ?? 'Anonymous',
    authorColor: d.authorColor ?? AVATAR_COLORS[0],
    content:    d.content ?? '',
    createdAt:  d.createdAt?.toMillis?.() ?? d.createdAt ?? Date.now(),
    parentId:   d.parentId,
    replyCount: d.replyCount ?? 0,
  };
}

async function getLocalReacted(): Promise<Record<string, ReactionType>> {
  const raw = await AsyncStorage.getItem(REACTED_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function getLocalPrayed(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(PRAYED_KEY);
  return new Set(raw ? JSON.parse(raw) : []);
}

async function getLocalJoined(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(JOINED_KEY);
  return new Set(raw ? JSON.parse(raw) : []);
}

// ── Posts: subscribe ──────────────────────────────────────────────────────────

export function subscribeToPosts(
  filter: 'all' | 'trending' | 'recent' | 'prayer' | 'bible',
  onUpdate: (posts: Post[]) => void,
): () => void {
  // Build query
  let q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(40));

  if (filter === 'prayer') {
    q = query(collection(db, 'communityPosts'), where('type', '==', 'prayer'), orderBy('createdAt', 'desc'), limit(40));
  } else if (filter === 'bible') {
    q = query(collection(db, 'communityPosts'), where('type', '==', 'scripture'), orderBy('createdAt', 'desc'), limit(40));
  } else if (filter === 'trending') {
    q = query(collection(db, 'communityPosts'), orderBy('commentCount', 'desc'), limit(40));
  }

  const unsub = onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        // Seed with sample data
        onUpdate(SAMPLE_POSTS);
        return;
      }
      const reacted = await getLocalReacted();
      const prayed  = await getLocalPrayed();
      const posts = snap.docs.map(d => docToPost(d.id, d.data(), reacted[d.id] as ReactionType | undefined, prayed.has(d.id)));
      onUpdate(posts);
    },
    () => onUpdate(SAMPLE_POSTS), // on error, use sample
  );
  return unsub;
}

// ── Posts: create ─────────────────────────────────────────────────────────────

export async function createPost(data: {
  type: PostType;
  content: string;
  scriptureRef?: string;
  category?: string;
}): Promise<string> {
  const userId = await getDeviceId();
  const name   = await getSavedDisplayName() ?? 'Believer';
  const idx    = Math.abs(userId.charCodeAt(0) % AVATAR_COLORS.length);
  const color  = AVATAR_COLORS[idx];

  const ref = await addDoc(collection(db, 'communityPosts'), {
    ...data,
    authorId:    userId,
    authorName:  name,
    authorColor: color,
    reactions:   { love: 0, praying: 0, inspired: 0, amen: 0, helpful: 0 },
    commentCount: 0,
    prayerCount:  0,
    createdAt:    Timestamp.now(),
  });
  return ref.id;
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export async function reactToPost(postId: string, reaction: ReactionType): Promise<void> {
  const reacted = await getLocalReacted();
  const prev    = reacted[postId] as ReactionType | undefined;
  const postRef = doc(db, 'communityPosts', postId);

  const updates: Record<string, any> = {};

  if (prev === reaction) {
    // Un-react
    updates[`reactions.${reaction}`] = increment(-1);
    delete reacted[postId];
  } else {
    if (prev) updates[`reactions.${prev}`] = increment(-1);
    updates[`reactions.${reaction}`] = increment(1);
    reacted[postId] = reaction;
  }

  await AsyncStorage.setItem(REACTED_KEY, JSON.stringify(reacted));
  try { await updateDoc(postRef, updates); } catch { /* offline */ }
}

// ── Prayer requests ───────────────────────────────────────────────────────────

export async function prayForPost(postId: string): Promise<boolean> {
  const prayed = await getLocalPrayed();
  const already = prayed.has(postId);

  if (!already) {
    prayed.add(postId);
    await AsyncStorage.setItem(PRAYED_KEY, JSON.stringify([...prayed]));
    try {
      await updateDoc(doc(db, 'communityPosts', postId), { prayerCount: increment(1) });
    } catch { /* offline */ }
  }
  return !already; // true if newly prayed
}

export async function markAnswered(postId: string): Promise<void> {
  try { await updateDoc(doc(db, 'communityPosts', postId), { answered: true }); } catch { /* offline */ }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function subscribeToComments(
  postId: string,
  onUpdate: (comments: Comment[]) => void,
): () => void {
  const q = query(
    collection(db, 'communityComments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc'),
    limit(50),
  );

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onUpdate(SAMPLE_COMMENTS.filter(c => c.postId === postId));
        return;
      }
      onUpdate(snap.docs.map(d => docToComment(d.id, d.data())));
    },
    () => onUpdate(SAMPLE_COMMENTS.filter(c => c.postId === postId)),
  );
}

export async function addComment(postId: string, content: string, parentId?: string): Promise<void> {
  const userId = await getDeviceId();
  const name   = await getSavedDisplayName() ?? 'Believer';
  const idx    = Math.abs(userId.charCodeAt(0) % AVATAR_COLORS.length);

  const batch = writeBatch(db);
  const commentRef = doc(collection(db, 'communityComments'));
  batch.set(commentRef, {
    postId, content, parentId: parentId ?? null,
    authorId: userId, authorName: name, authorColor: AVATAR_COLORS[idx],
    replyCount: 0, createdAt: Timestamp.now(),
  });
  batch.update(doc(db, 'communityPosts', postId), { commentCount: increment(1) });
  await batch.commit();
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function getGroups(): Promise<Group[]> {
  const joined  = await getLocalJoined();
  try {
    const snap = await getDocs(collection(db, 'communityGroups'));
    if (snap.empty) return SAMPLE_GROUPS.map(g => ({ ...g, joined: joined.has(g.id) }));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, name: data.name, description: data.description,
        icon: data.icon, memberCount: data.memberCount, category: data.category,
        joined: joined.has(d.id), chatId: data.chatId,
      };
    });
  } catch {
    return SAMPLE_GROUPS.map(g => ({ ...g, joined: joined.has(g.id) }));
  }
}

export async function joinGroup(groupId: string): Promise<void> {
  const joined = await getLocalJoined();
  const userId = await getDeviceId();

  if (!joined.has(groupId)) {
    joined.add(groupId);
    await AsyncStorage.setItem(JOINED_KEY, JSON.stringify([...joined]));
    try {
      await updateDoc(doc(db, 'communityGroups', groupId), { memberCount: increment(1) });
      await setDoc(doc(db, 'communityGroupMembers', `${groupId}_${userId}`), {
        groupId, userId, joinedAt: Timestamp.now(),
      });
    } catch { /* offline */ }
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchPosts(term: string): Promise<Post[]> {
  // Client-side search over recent posts — good enough for MVP
  // For production, use Algolia or Firebase full-text extension
  const lower = term.toLowerCase();
  const reacted = await getLocalReacted();
  const prayed  = await getLocalPrayed();

  try {
    const snap = await getDocs(query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(100)));
    const all  = snap.empty
      ? SAMPLE_POSTS
      : snap.docs.map(d => docToPost(d.id, d.data(), reacted[d.id] as ReactionType | undefined, prayed.has(d.id)));
    return all.filter(p =>
      p.content.toLowerCase().includes(lower) ||
      p.authorName.toLowerCase().includes(lower) ||
      (p.scriptureRef ?? '').toLowerCase().includes(lower),
    );
  } catch {
    return SAMPLE_POSTS.filter(p =>
      p.content.toLowerCase().includes(lower) ||
      p.authorName.toLowerCase().includes(lower) ||
      (p.scriptureRef ?? '').toLowerCase().includes(lower),
    );
  }
}
