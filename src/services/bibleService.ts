import NetInfo from '@react-native-community/netinfo';
import { fetchChapterOnline, fetchAvailableBibles, type Verse } from './apiBibleService';
import { fetchChapterOffline } from './offlineBibleService';
import { API_BIBLE_KEY } from '../config/bibleConfig';

export type { Verse };

export type BibleVersion = {
  id: string;
  name: string;
  abbreviation: string;
  source: 'offline' | 'online';
  language?: string;
};

export const OFFLINE_BIBLES: BibleVersion[] = [
  { id: 'kjv',         name: 'King James Version',  abbreviation: 'KJV',   source: 'offline', language: 'English'     },
  { id: 'asante_twi',  name: 'Asante Twi Bible',    abbreviation: 'TWI-A', source: 'offline', language: 'Asante Twi'  },
  { id: 'akuapem_twi', name: 'Akuapem Twi Bible',   abbreviation: 'TWI-K', source: 'offline', language: 'Akuapem Twi' },
];

export type ChapterResult = {
  verses: Verse[];
  source: 'online' | 'offline';
};

// In-memory cache keyed by `{translationId}:{usfmId}:{chapter}`
const cache = new Map<string, Verse[]>();

export async function checkOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
}

export async function loadChapter(
  bookIndex: number,
  usfmId: string,
  chapter: number,
  bible: BibleVersion
): Promise<ChapterResult> {
  const cacheKey = `${bible.id}:${usfmId}:${chapter}`;

  if (cache.has(cacheKey)) {
    return { verses: cache.get(cacheKey)!, source: bible.source };
  }

  // Bundled translations: always read from local JSON, no network needed
  if (bible.source === 'offline') {
    const verses = fetchChapterOffline(bible.id, bookIndex, chapter);
    cache.set(cacheKey, verses);
    return { verses, source: 'offline' };
  }

  // Online translations: try API.Bible, fall back to bundled KJV on failure
  const online = await checkOnline();
  if (online && API_BIBLE_KEY) {
    try {
      const verses = await fetchChapterOnline(bible.id, usfmId, chapter);
      cache.set(cacheKey, verses);
      return { verses, source: 'online' };
    } catch {
      // fall through to KJV offline fallback
    }
  }

  const verses = fetchChapterOffline('kjv', bookIndex, chapter);
  return { verses, source: 'offline' };
}

export async function loadOnlineBibles(): Promise<BibleVersion[]> {
  const list = await fetchAvailableBibles();
  return list.map((b) => ({ ...b, source: 'online' as const }));
}
