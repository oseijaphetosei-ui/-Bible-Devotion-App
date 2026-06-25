import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { ttsSpeak } from './appApi';

function safeCacheKey(cacheKey: string): string {
  return cacheKey.replace(/[^a-z0-9._-]/gi, '_');
}

let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  audioModeConfigured = true;
}

// Fetch TTS audio from the backend function and cache locally so repeat plays are instant
export async function fetchTTSChunk(text: string, cacheKey: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}tts_${safeCacheKey(cacheKey)}.mp3`;

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) return uri;

  const result = await ttsSpeak({ text });
  await FileSystem.writeAsStringAsync(uri, result.audioBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return uri;
}

// Play a text string directly (no caching) — for short snippets
export async function speakText(text: string, cacheKey?: string): Promise<Audio.Sound> {
  await ensureAudioMode();
  const uri = cacheKey
    ? await fetchTTSChunk(text, cacheKey)
    : await (async () => {
        const result = await ttsSpeak({ text });
        const tempUri = `${FileSystem.cacheDirectory}tts_tmp_${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(tempUri, result.audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
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

// Delete cached audio for a given story/content id
export async function clearTTSCache(id: string, chunkCount: number): Promise<void> {
  for (let i = 0; i < chunkCount; i++) {
    const uri = `${FileSystem.cacheDirectory}tts_${safeCacheKey(id)}_${i}.mp3`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
