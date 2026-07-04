import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const geminiKey = defineSecret('GEMINI_API_KEY');

function getAI() {
  return new GoogleGenAI({ apiKey: geminiKey.value() });
}

// Bump this file when we need Firebase to publish a fresh revision for the AI functions.
const FUNCTION_REVISION_NOTE = 'ai-functions-refresh-2026-06-24';
const GEMINI_MODEL = 'gemini-3.5-flash';
const DEVOTION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    scriptureReference: { type: 'string' },
    scriptureText: { type: 'string' },
    keyTheme: { type: 'string' },
    devotionalBody: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
    },
    lifeApplication: { type: 'string' },
    reflectionQuestion: { type: 'string' },
    guidedPrayer: { type: 'string' },
    shareableQuote: { type: 'string' },
  },
  required: [
    'title',
    'scriptureReference',
    'scriptureText',
    'keyTheme',
    'devotionalBody',
    'lifeApplication',
    'reflectionQuestion',
    'guidedPrayer',
    'shareableQuote',
  ],
  additionalProperties: false,
} as const;

// ── Ask Scripture (Talk to Scripture chat) ────────────────────────────────────

export const askScripture = onCall(
  { secrets: [geminiKey], cors: true, invoker: 'public' },
  async (request) => {
    const { reference, context, messages } = request.data as {
      reference: string;
      context: string;
      messages: Array<{ role: string; content: string }>;
    };

    if (!reference || !messages?.length) {
      throw new HttpsError('invalid-argument', 'Missing reference or messages.');
    }

    console.log('[askScripture] request received', {
      revision: FUNCTION_REVISION_NOTE,
      reference,
      messageCount: messages.length,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = getAI().chats.create({
      model: GEMINI_MODEL,
      history,
      config: {
        systemInstruction: `You are a knowledgeable, faithful, and warm Bible scholar and spiritual guide helping someone study Scripture deeply.

The user is currently studying: ${reference}
Passage context: ${context}

Guidelines:
- Ground every answer in Scripture and sound theology
- Be warm, personal, and spiritually encouraging
- Keep responses focused (3–5 paragraphs max unless a list is clearly better)
- Use **bold** for scripture references and key spiritual truths
- When asked about application, be specific and practical
- Do not speculate beyond what Scripture teaches
- If the question is off-topic, gently redirect back to the passage`,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage({ message: lastMessage.content });

    console.log('[askScripture] response generated', {
      revision: FUNCTION_REVISION_NOTE,
      hasText: Boolean(result.text),
    });

    return { content: result.text ?? '' };
  },
);

// ── Generate Devotion ─────────────────────────────────────────────────────────

export const generateDevotion = onCall(
  { secrets: [geminiKey], cors: true, invoker: 'public' },
  async (request) => {
    const { topic, translation } = request.data as {
      topic: string;
      translation: string;
    };

    if (!topic) {
      throw new HttpsError('invalid-argument', 'Missing topic.');
    }

    console.log('[generateDevotion] request received', {
      revision: FUNCTION_REVISION_NOTE,
      topic,
      translation: translation || 'NIV',
    });

    const prompt = `Generate a deep, spiritually rich, and personally engaging Christian daily devotion on the topic: "${topic}"
Bible translation: ${translation || 'NIV'}

Return ONLY valid JSON matching this exact structure — no markdown, no extra text:
{
  "title": "Compelling devotion title (5–9 words)",
  "scriptureReference": "Book Chapter:Verse or Book Chapter:Verse-Verse",
  "scriptureText": "The full passage text in ${translation || 'NIV'}",
  "keyTheme": "2–3 word theme label",
  "devotionalBody": [
    "Paragraph 1 — introduce the scripture with historical or textual context and why it matters today (90–120 words)",
    "Paragraph 2 — the deeper spiritual truth and what it reveals about God's character (90–120 words)",
    "Paragraph 3 — personal transformation and hope — speak directly to the reader (90–120 words)"
  ],
  "lifeApplication": "One specific, actionable step the reader can take today (1–2 sentences)",
  "reflectionQuestion": "A personal, searching question that invites honest self-examination",
  "guidedPrayer": "A heartfelt 4–6 sentence prayer in first person, honest and specific",
  "shareableQuote": "A powerful, quotable spiritual insight in double quotes"
}`;

    const result = await getAI().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: DEVOTION_SCHEMA,
        maxOutputTokens: 4096,
        temperature: 0.4,
      },
    });

    const text = (result.text ?? '').trim();

    try {
      console.log('[generateDevotion] response parsed', {
        revision: FUNCTION_REVISION_NOTE,
        length: text.length,
      });
      return JSON.parse(text);
    } catch {
      const clean = text.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
      console.warn('[generateDevotion] falling back to manual JSON parse', {
        revision: FUNCTION_REVISION_NOTE,
        length: clean.length,
      });
      return JSON.parse(clean);
    }
  },
);

// ── AI Insights (verse/chapter analysis) ─────────────────────────────────────

export const getScriptureInsights = onCall(
  { secrets: [geminiKey], cors: true, invoker: 'public' },
  async (request) => {
    const { reference, text, type } = request.data as {
      reference: string;
      text: string;
      type: 'verse' | 'chapter';
    };

    if (!reference || !text) {
      throw new HttpsError('invalid-argument', 'Missing reference or text.');
    }

    console.log('[getScriptureInsights] request received', {
      revision: FUNCTION_REVISION_NOTE,
      reference,
      type,
      textLength: text.length,
    });

    const prompt = `Provide spiritual and theological insights for the following Bible ${type}:

Reference: ${reference}
Text: "${text}"

Return ONLY valid JSON in this exact structure:
{
  "summary": "A 2–3 sentence overview of the passage's core message",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "historicalContext": "1–2 sentences of relevant historical or cultural background",
  "theologicalInsight": "The deepest spiritual truth this passage reveals (2–3 sentences)",
  "crossReferences": [
    { "reference": "Book Chapter:Verse", "connection": "Why this connects" },
    { "reference": "Book Chapter:Verse", "connection": "Why this connects" },
    { "reference": "Book Chapter:Verse", "connection": "Why this connects" }
  ],
  "applicationToday": "How this passage speaks to modern life (2 sentences)",
  "prayerFocus": "A single-sentence prayer prompt based on this passage"
}`;

    const result = await getAI().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text2 = (result.text ?? '').trim();

    try {
      console.log('[getScriptureInsights] response parsed', {
        revision: FUNCTION_REVISION_NOTE,
        length: text2.length,
      });
      return JSON.parse(text2);
    } catch {
      const clean = text2.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
      return JSON.parse(clean);
    }
  },
);

// ── Text-to-Speech (Google Cloud TTS) ────────────────────────────────────────
// Single source of truth for voice configuration across the entire app.
// When changing the voice, also bump TTS_CACHE_VERSION in src/services/ttsService.ts
// so clients discard cached audio from the previous voice.
//
// Voice profile: en-US-Studio-Q — natural male baritone, clear and compassionate.
// Studio voices are Google's highest-quality tier, purpose-built for long-form audio
// (audiobooks, scripture) with natural prosody and accurate proper-noun pronunciation.
// See: https://cloud.google.com/text-to-speech/docs/voices

const TTS_VOICE_LANGUAGE = 'en-US';
const TTS_VOICE_NAME     = 'en-US-Studio-Q';  // male Studio baritone for scripture; matches TTS_VOICE_ID in ttsService.ts
const TTS_SPEAKING_RATE  = 0.87;              // measured pace for reflection
const TTS_PITCH          = -3.0;              // baritone depth

const ttsClient = new TextToSpeechClient();

export const ttsSpeak = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const { text } = request.data as { text: string };

    if (!text?.trim()) {
      throw new HttpsError('invalid-argument', 'Missing text.');
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text: text.trim() },
      voice: { languageCode: TTS_VOICE_LANGUAGE, name: TTS_VOICE_NAME },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: TTS_SPEAKING_RATE,
        pitch: TTS_PITCH,
      },
    });

    if (!response.audioContent) {
      throw new HttpsError('internal', 'No audio data returned by TTS.');
    }

    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
    return { audioBase64, mimeType: 'audio/mp3' };
  },
);
