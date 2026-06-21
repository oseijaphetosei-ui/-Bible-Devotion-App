import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebaseConfig';

const ttsCall = httpsCallable<
  { text: string },
  { audioBase64: string; mimeType: string }
>(functions, 'ttsSpeak');

// Fetch TTS audio via Gemini, cache locally so repeat plays are instant
export async function fetchTTSChunk(text: string, cacheKey: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}tts_${cacheKey}.wav`;

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) return uri;

  const result = await ttsCall({ text });
  await FileSystem.writeAsStringAsync(uri, result.data.audioBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return uri;
}

// Play a text string directly (no caching) — for short snippets
export async function speakText(text: string): Promise<Audio.Sound> {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const result = await ttsCall({ text });
  const uri = `${FileSystem.cacheDirectory}tts_tmp_${Date.now()}.wav`;
  await FileSystem.writeAsStringAsync(uri, result.data.audioBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  return sound;
}

// Delete cached audio for a given story/content id
export async function clearTTSCache(id: string, chunkCount: number): Promise<void> {
  for (let i = 0; i < chunkCount; i++) {
    const uri = `${FileSystem.cacheDirectory}tts_${id}_${i}.wav`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
