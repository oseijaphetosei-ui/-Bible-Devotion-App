import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebaseConfig';
import type { Devotion } from '../types/devotion';
import type { ChatMessage } from '../types/scriptureChat';

type TtsResponse = {
  audioBase64: string;
  mimeType: string;
};

async function callFunction<TRequest, TResponse>(
  name: string,
  data: TRequest,
): Promise<TResponse> {
  const fn = httpsCallable<TRequest, TResponse>(functions, name);
  const result = await fn(data);
  return result.data;
}

export function askScripture(data: {
  reference: string;
  context: string;
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>;
}): Promise<{ content: string }> {
  return callFunction('askScripture', data);
}

export function generateDevotion(data: {
  topic: string;
  translation: string;
}): Promise<Devotion> {
  return callFunction('generateDevotion', data);
}

export function getScriptureInsights(data: {
  reference: string;
  text: string;
  type: 'verse' | 'chapter';
}): Promise<{
  summary: string;
  keyThemes: string[];
  historicalContext: string;
  theologicalInsight: string;
  crossReferences: Array<{ reference: string; connection: string }>;
  applicationToday: string;
  prayerFocus: string;
}> {
  return callFunction('getScriptureInsights', data);
}

export function ttsSpeak(data: { text: string }): Promise<TtsResponse> {
  return callFunction('ttsSpeak', data);
}
