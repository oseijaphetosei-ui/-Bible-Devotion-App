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

// ── AI Sermon Builder ─────────────────────────────────────────────────────────

const AUDIENCE_STYLE: Record<string, string> = {
  children_4_8:  'Children aged 4–8. Use very simple language, short sentences, fun stories, object lessons, and interactive questions. Avoid abstract theology. Everything must be concrete and joyful.',
  children_9_12: 'Children aged 9–12. Use age-appropriate language, relatable school and family scenarios, engaging questions, and clear moral lessons.',
  youth:         'Teenagers. Address identity, social media, peer pressure, dating, mental health, purpose, and belonging. Be authentic, direct, and use modern illustrations.',
  young_adults:  'Young adults aged 18–30. Address career, purpose, relationships, doubt, and faith. Be intellectually engaging, culturally aware, and practically grounded.',
  adults:        'Adult congregation. Provide rich biblical exposition, historical background, theological depth where appropriate, and practical Christian living applications.',
  family:        'Mixed family service with all ages present. Balance depth for adults with accessible illustrations for children. Include family application points and wholesome examples.',
  mixed:         'Mixed congregation of various ages and backgrounds. Keep language clear, inclusive, and universally accessible. Use diverse illustrations and balance theology with warmth.',
};

const POINT_COUNT: Record<string, number> = {
  '10': 2,
  '20': 2,
  '30': 3,
  '45': 3,
  '60': 4,
};

export const generateSermon = onCall(
  { secrets: [geminiKey], cors: true, invoker: 'public' },
  async (request) => {
    const { audience, audienceLabel, sermonType, scriptures, topic, duration, tone } = request.data as {
      audience: string;
      audienceLabel: string;
      sermonType: string;
      scriptures: string[];
      topic: string;
      duration: number;
      tone: string;
    };

    if (!audience || !sermonType) {
      throw new HttpsError('invalid-argument', 'Missing required fields.');
    }

    const audienceStyle = AUDIENCE_STYLE[audience] ?? AUDIENCE_STYLE.adults;
    const scriptureText = (scriptures ?? []).filter(Boolean).join(', ') || 'Let the topic guide the Scripture selection';
    const topicText     = topic || 'Based on the selected scripture';
    const pointCount    = POINT_COUNT[String(duration)] ?? 3;

    console.log('[generateSermon] request received', { revision: FUNCTION_REVISION_NOTE, audience, sermonType, duration, tone });

    const prompt = `You are a master theologian, pastor, and homiletics expert with 40 years of ministry across diverse cultural contexts.
Generate a comprehensive, biblically faithful, professionally structured sermon.

AUDIENCE: ${audienceLabel}
AUDIENCE STYLE: ${audienceStyle}
SERMON TYPE: ${sermonType}
SCRIPTURE REFERENCES: ${scriptureText}
TOPIC: ${topicText}
DURATION: ${duration} minutes
TONE: ${tone}
MAIN POINTS: Generate exactly ${pointCount} main points appropriate for ${duration} minutes

CRITICAL GUIDELINES:
- Every claim must be grounded in Scripture with specific references
- Vocabulary, illustrations, and applications must be perfectly calibrated for this specific audience
- For a ${tone} tone: adjust vocabulary, energy, and delivery style accordingly
- Be theologically sound; acknowledge where faithful Christian traditions differ
- Never fabricate Bible verses or misattribute quotes to real people
- Make illustrations vivid, culturally relevant, and audience-appropriate
- Applications must be specific, actionable, and achievable

Return ONLY valid JSON — no markdown, no extra text:

{
  "titles": [
    "Title option 1 (5–8 words, compelling and clear)",
    "Title option 2 (poetic or question-based)",
    "Title option 3 (action or promise-based)"
  ],
  "theme": "One sentence capturing the sermon's central message",
  "bigIdea": "The single non-negotiable biblical truth this sermon communicates",
  "keyScripture": "Primary passage reference (e.g., John 15:1-8)",
  "supportingScriptures": ["Ref 1", "Ref 2", "Ref 3", "Ref 4", "Ref 5", "Ref 6"],
  "openingPrayer": "Heartfelt 5-sentence opening prayer directly connected to the sermon theme",
  "introduction": "Compelling 180-word introduction with audience-appropriate story or illustration that creates curiosity and sets up the sermon",
  "historicalBackground": "120-word explanation of authorship, original audience, historical setting, cultural context, and literary context of the key passage",
  "mainPoints": [
    {
      "heading": "Concise, memorable point heading",
      "scripture": "Scripture reference supporting this point",
      "explanation": "100-word clear explanation of the passage with biblical exegesis",
      "illustration": "70-word vivid illustration perfectly suited to this audience",
      "application": "60-word specific, actionable application for this audience",
      "reflectionQuestion": "Thoughtful personal reflection or group discussion question"
    }
  ],
  "practicalApplications": [
    "Specific actionable step 1 for this audience",
    "Specific actionable step 2",
    "Specific actionable step 3",
    "Specific actionable step 4",
    "Specific actionable step 5"
  ],
  "reflectionQuestions": [
    "Personal reflection question 1",
    "Group discussion question 2",
    "Heart-searching question 3",
    "Application question 4",
    "Commitment question 5"
  ],
  "memoryVerse": "Book Chapter:Verse",
  "memoryVerseText": "The complete text of the memory verse",
  "invitation": "90-word grace-filled invitation or response moment appropriate for this sermon type and audience",
  "closingPrayer": "6-sentence closing prayer that gathers the sermon's themes into a commissioning prayer",
  "worshipSuggestions": ["Song/Hymn 1", "Song/Hymn 2", "Song/Hymn 3", "Song/Hymn 4", "Song/Hymn 5"],
  "discussionQuestions": [
    "Small group question 1",
    "Small group question 2",
    "Small group question 3",
    "Small group question 4",
    "Small group question 5"
  ]
}`;

    const result = await getAI().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
        temperature: 0.55,
      },
    });

    const raw = (result.text ?? '').trim();
    console.log('[generateSermon] response received', { revision: FUNCTION_REVISION_NOTE, length: raw.length });

    try {
      return JSON.parse(raw);
    } catch {
      const clean = raw.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
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
