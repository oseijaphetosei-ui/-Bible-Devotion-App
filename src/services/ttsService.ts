import * as FileSystem from 'expo-file-system/legacy';
import { OPENAI_API_KEY, TTS_VOICE, TTS_MODEL } from '../config/openaiConfig';

const TTS_URL = 'https://api.openai.com/v1/audio/speech';

async function toBase64(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as any);
  }
  return btoa(binary);
}

export async function fetchTTSChunk(
  text: string,
  cacheKey: string,
): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}tts_${cacheKey}.mp3`;

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) return uri;

  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set in src/config/openaiConfig.ts');

  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: text,
      voice: TTS_VOICE,
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.status.toString());
    throw new Error(`OpenAI TTS ${res.status}: ${msg}`);
  }

  const base64 = await toBase64(res);
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

export async function clearTTSCache(storyId: string, chunkCount: number): Promise<void> {
  for (let i = 0; i < chunkCount; i++) {
    const uri = `${FileSystem.cacheDirectory}tts_${storyId}_${i}.mp3`;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
