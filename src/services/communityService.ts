import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, increment, Timestamp, writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { getDeviceId } from './notesService';

async function ensureAuth(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}
import type { Post, Comment, Group, PostType, ReactionType } from '../types/community';
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
  filter: 'all' | 'trending' | 'recent' | 'prayer' | 'bible' | 'testimony' | 'question',
  onUpdate: (posts: Post[]) => void,
): () => void {
  let q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'), limit(40));

  if (filter === 'prayer') {
    q = query(collection(db, 'communityPosts'), where('type', '==', 'prayer'), orderBy('createdAt', 'desc'), limit(40));
  } else if (filter === 'bible') {
    q = query(collection(db, 'communityPosts'), where('type', '==', 'scripture'), orderBy('createdAt', 'desc'), limit(40));
  } else if (filter === 'testimony') {
    q = query(collection(db, 'communityPosts'), where('type', '==', 'testimony'), orderBy('createdAt', 'desc'), limit(40));
  } else if (filter === 'question') {
    q = query(collection(db, 'communityPosts'), where('type', '==', 'question'), orderBy('createdAt', 'desc'), limit(40));
  } else if (filter === 'trending') {
    q = query(collection(db, 'communityPosts'), orderBy('commentCount', 'desc'), limit(40));
  }

  const unsub = onSnapshot(
    q,
    async (snap) => {
      const reacted = await getLocalReacted();
      const prayed  = await getLocalPrayed();
      onUpdate(snap.docs.map(d => docToPost(d.id, d.data(), reacted[d.id] as ReactionType | undefined, prayed.has(d.id))));
    },
    () => onUpdate([]),
  );
  return unsub;
}

// ── Posts: fetch single ───────────────────────────────────────────────────────

export function subscribeToPost(
  postId: string,
  onUpdate: (post: Post | null) => void,
): () => void {
  return onSnapshot(
    doc(db, 'communityPosts', postId),
    async (snap) => {
      if (!snap.exists()) { onUpdate(null); return; }
      const reacted = await getLocalReacted();
      const prayed  = await getLocalPrayed();
      onUpdate(docToPost(snap.id, snap.data(), reacted[snap.id] as ReactionType | undefined, prayed.has(snap.id)));
    },
    () => onUpdate(null),
  );
}

// ── Posts: create ─────────────────────────────────────────────────────────────

export async function createPost(data: {
  type: PostType;
  content: string;
  scriptureRef?: string;
  category?: string;
}): Promise<string> {
  await ensureAuth();
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
  await ensureAuth();
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
  await ensureAuth();
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
    (snap) => { onUpdate(snap.docs.map(d => docToComment(d.id, d.data()))); },
    () => onUpdate([]),
  );
}

export async function addComment(postId: string, content: string, parentId?: string): Promise<void> {
  await ensureAuth();
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

const DEFAULT_GROUPS_SEED: Omit<Group, 'joined'>[] = [
  { id: 'grp_prayer_circle',    name: 'Daily Prayer Circle',    description: 'Join together in daily prayer and intercession for one another.',   icon: '🙏', memberCount: 128, category: 'prayer',     chatId: 'grp_prayer_circle'    },
  { id: 'grp_bible_study',      name: 'Bible Study Fellowship', description: 'Deep dive into scripture, share insights and grow in the Word.',      icon: '📖', memberCount: 94,  category: 'bible',      chatId: 'grp_bible_study'      },
  { id: 'grp_testimony_corner', name: 'Testimony Corner',       description: 'Share and celebrate what God is doing in your life.',                  icon: '✨', memberCount: 76,  category: 'testimony',  chatId: 'grp_testimony_corner' },
  { id: 'grp_new_believers',    name: 'New Believers',          description: 'A welcoming space for those who are new to faith in Christ.',          icon: '✝️', memberCount: 52,  category: 'fellowship', chatId: 'grp_new_believers'    },
  { id: 'grp_men_of_faith',     name: 'Men of Faith',           description: 'Brotherhood, accountability, and spiritual growth for men.',            icon: '💪', memberCount: 61,  category: 'fellowship', chatId: 'grp_men_of_faith'     },
  { id: 'grp_women_of_god',     name: 'Women of God',           description: 'Sisters in faith lifting each other up in love and truth.',             icon: '🌸', memberCount: 83,  category: 'fellowship', chatId: 'grp_women_of_god'     },
  { id: 'grp_youth_ministry',   name: 'Youth Ministry',         description: 'A vibrant community for young believers walking with God.',             icon: '🎯', memberCount: 47,  category: 'youth',      chatId: 'grp_youth_ministry'   },
  { id: 'grp_worship_praise',   name: 'Worship & Praise',       description: 'Share songs, hymns, praise reports, and moments of worship.',          icon: '🎵', memberCount: 115, category: 'worship',    chatId: 'grp_worship_praise'   },
];

async function seedDefaultGroups(): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const g of DEFAULT_GROUPS_SEED) {
      const { id, ...data } = g;
      batch.set(doc(db, 'communityGroups', id), { ...data, createdAt: Timestamp.now() });
    }
    await batch.commit();
  } catch { /* offline, ignore */ }
}

export async function getGroups(): Promise<Group[]> {
  const joined = await getLocalJoined();
  try {
    const snap = await getDocs(collection(db, 'communityGroups'));
    const firestoreGroups: Group[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, name: data.name, description: data.description,
        icon: data.icon, memberCount: data.memberCount, category: data.category,
        joined: joined.has(d.id), chatId: data.chatId ?? d.id,
      };
    });

    if (firestoreGroups.length === 0) {
      // Seed Firestore in the background, return defaults immediately
      seedDefaultGroups();
      return DEFAULT_GROUPS_SEED.map(g => ({ ...g, joined: joined.has(g.id) }));
    }

    // Merge: Firestore docs override defaults with same ID; unmatched defaults append
    const firestoreIds = new Set(firestoreGroups.map(g => g.id));
    const extraDefaults = DEFAULT_GROUPS_SEED
      .filter(g => !firestoreIds.has(g.id))
      .map(g => ({ ...g, joined: joined.has(g.id) }));

    return [...firestoreGroups, ...extraDefaults];
  } catch {
    // Offline fallback
    return DEFAULT_GROUPS_SEED.map(g => ({ ...g, joined: joined.has(g.id) }));
  }
}

export async function joinGroup(groupId: string): Promise<void> {
  await ensureAuth();
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
    const all  = snap.docs.map(d => docToPost(d.id, d.data(), reacted[d.id] as ReactionType | undefined, prayed.has(d.id)));
    return all.filter(p =>
      p.content.toLowerCase().includes(lower) ||
      p.authorName.toLowerCase().includes(lower) ||
      (p.scriptureRef ?? '').toLowerCase().includes(lower),
    );
  } catch {
    return [];
  }
}
