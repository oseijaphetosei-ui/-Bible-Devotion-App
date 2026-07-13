import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { ttsSpeak } from './appApi';

// ─── Voice configuration ──────────────────────────────────────────────────────
// Must match the voice configured in functions/src/index.ts → ttsSpeak.
// Bump TTS_CACHE_VERSION whenever the server voice or audio config changes so
// stale cached files from the previous voice are never served again.
export const TTS_VOICE_ID      = 'en-US-Studio-Q'; // natural male baritone (Studio tier)
export const TTS_CACHE_VERSION = 'stq1';            // bump so old Neural2-D cache is discarded

function safeName(key: string): string {
  return key.replace(/[^a-z0-9._-]/gi, '_');
}

function cacheUri(cacheKey: string): string {
  return `${FileSystem.cacheDirectory}tts_${TTS_CACHE_VERSION}_${safeName(cacheKey)}.mp3`;
}

let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  audioModeConfigured = true;
  purgeStaleTTSCache();
}

// Delete cached audio from previous TTS_CACHE_VERSIONs — those files can never
// be served again (the version is part of the filename) so they are pure waste.
let stalePurgeRan = false;
async function purgeStaleTTSCache(): Promise<void> {
  if (stalePurgeRan) return;
  stalePurgeRan = true;
  try {
    const dir = FileSystem.cacheDirectory!;
    const files = await FileSystem.readDirectoryAsync(dir);
    const currentPrefix = `tts_${TTS_CACHE_VERSION}_`;
    await Promise.all(
      files
        .filter(f => f.startsWith('tts_') && !f.startsWith(currentPrefix))
        .map(f => FileSystem.deleteAsync(dir + f, { idempotent: true })),
    );
  } catch { /* best-effort cleanup */ }
}

// Write TTS audio to a local file: prefer the CDN URL (25% smaller transfer,
// server synthesizes each unique text only once), fall back to inline base64.
async function saveTTSAudio(
  result: { audioUrl?: string; audioBase64?: string },
  uri: string,
): Promise<void> {
  if (result.audioUrl) {
    await FileSystem.downloadAsync(result.audioUrl, uri);
  } else if (result.audioBase64) {
    await FileSystem.writeAsStringAsync(uri, result.audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    throw new Error('TTS response contained no audio.');
  }
}

// Fetch TTS audio from the backend function and cache locally so repeat plays are instant
export async function fetchTTSChunk(text: string, cacheKey: string): Promise<string> {
  const uri = cacheUri(cacheKey);

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) return uri;

  const result = await ttsSpeak({ text });
  await saveTTSAudio(result, uri);

  return uri;
}

// Speak a text string, caching the audio locally when a stable cacheKey is provided.
// Always call with a cacheKey for content that may be replayed (verses, devotions, stories).
// Omit cacheKey only for one-off ephemeral playback.
export async function speakText(text: string, cacheKey?: string): Promise<Audio.Sound> {
  await ensureAudioMode();
  const uri = cacheKey
    ? await fetchTTSChunk(text, cacheKey)
    : await (async () => {
        const result = await ttsSpeak({ text });
        const tempUri = `${FileSystem.cacheDirectory}tts_tmp_${TTS_CACHE_VERSION}_${Date.now()}.mp3`;
        await saveTTSAudio(result, tempUri);
        return tempUri;
      })();
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  return sound;
}

export async function waitForSound(sound: Audio.Sound): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        if ('error' in status && status.error) reject(new Error(status.error));
        return;
      }
      if (status.didJustFinish) resolve();
    });
  });
}

// Delete versioned cached audio chunks for a given story/content id
export async function clearTTSCache(id: string, chunkCount: number): Promise<void> {
  for (let i = 0; i < chunkCount; i++) {
    const uri = cacheUri(`${id}_${i}`);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
