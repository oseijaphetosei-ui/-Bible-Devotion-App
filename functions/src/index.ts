import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiKey = defineSecret('GEMINI_API_KEY');

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

    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
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
    });

    // Build history from all messages except the last (which we send now)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);

    return { content: result.response.text() };
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

    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
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

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
      return JSON.parse(text);
    } catch {
      // Strip markdown code fences if Gemini wraps the output
      const clean = text.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
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

    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
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

    const result = await model.generateContent(prompt);
    const text2 = result.response.text().trim();

    try {
      return JSON.parse(text2);
    } catch {
      const clean = text2.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
      return JSON.parse(clean);
    }
  },
);

// ── Text-to-Speech (Gemini TTS model) ────────────────────────────────────────

export const ttsSpeak = onCall(
  { secrets: [geminiKey], cors: true, invoker: 'public' },
  async (request) => {
    const { text } = request.data as { text: string };

    if (!text?.trim()) {
      throw new HttpsError('invalid-argument', 'Missing text.');
    }

    const apiKey = geminiKey.value();

    // Gemini 2.5 Flash TTS — same API key, no extra service needed
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.trim() }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                // Kore: warm, clear female voice — great for devotional content
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text().catch(() => res.status.toString());
      throw new HttpsError('internal', `Gemini TTS error: ${err}`);
    }

    const data = await res.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!part?.data) {
      throw new HttpsError('internal', 'No audio data returned by Gemini TTS.');
    }

    return { audioBase64: part.data as string, mimeType: (part.mimeType as string) ?? 'audio/wav' };
  },
);
