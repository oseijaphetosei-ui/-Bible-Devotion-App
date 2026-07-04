import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app from '../config/firebaseConfig';
import { LOCAL_AUDIO_MAP } from '../data/hymnAudioMap';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResolvedAudio =
  | { type: 'local';  source: number }
  | { type: 'stream'; source: { uri: string } }
  | { type: 'none';   reason: string };

// ── Storage singleton ─────────────────────────────────────────────────────────

let _storage: ReturnType<typeof getStorage> | null = null;
function storage() {
  if (!_storage) _storage = getStorage(app);
  return _storage;
}

// ── Memory cache for streaming URLs ──────────────────────────────────────────
// null  → checked Firebase, file not found (or permission denied)
// undefined → not yet checked

const streamCache: Record<string, string | null | undefined> = {};

// ── Resolver ──────────────────────────────────────────────────────────────────

export async function resolveHymnAudio(hymnId: string): Promise<ResolvedAudio> {
  // 1 ── Local bundle: instant, offline, no network
  const localAsset = LOCAL_AUDIO_MAP[hymnId];
  if (localAsset !== undefined) {
    return { type: 'local', source: localAsset };
  }

  // 2 ── Memory-cache hit for streaming URL
  const cached = streamCache[hymnId];
  if (cached !== undefined) {
    return cached
      ? { type: 'stream', source: { uri: cached } }
      : { type: 'none', reason: 'not-uploaded' };
  }

  // 3 ── Firebase Storage  (path convention: hymns/{hymnId}.mp3)
  try {
    const url = await getDownloadURL(ref(storage(), `hymns/${hymnId}.mp3`));
    streamCache[hymnId] = url;
    return { type: 'stream', source: { uri: url } };
  } catch (err: any) {
    const code: string = err?.code ?? '';
    // object-not-found is expected; any other error may be transient
    streamCache[hymnId] = code === 'storage/object-not-found' ? null : undefined;
    const reason = code === 'storage/object-not-found' ? 'not-uploaded' : 'network-error';
    if (__DEV__ && reason === 'network-error') {
      console.warn('[HymnAudio] transient error for', hymnId, err);
    }
    return { type: 'none', reason };
  }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

/** Call after a successful Firebase Storage upload so the next play is instant. */
export function primeStreamCache(hymnId: string, url: string) {
  streamCache[hymnId] = url;
}

/** Force a fresh lookup on next call (useful after uploading a file). */
export function invalidateStreamCache(hymnId: string) {
  delete streamCache[hymnId];
}
