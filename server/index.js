/**
 * Bible Devotion App — Gemini API proxy server
 *
 * Setup:
 *   cd server
 *   npm install express cors node-fetch dotenv
 *   echo "GEMINI_API_KEY=your_key_here" > .env
 *   node index.js
 *
 * In production, deploy this to Render / Railway / Fly.io and update
 * SERVER_URL in src/services/devotionService.ts.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are a thoughtful Christian devotional writer.
Respond ONLY with valid JSON — no markdown fences, no commentary, no extra text.`;

function buildPrompt(topic, translation) {
  return `Write a rich daily devotion on the theme of "${topic}" using the ${translation} Bible translation.

Return a single JSON object with exactly these fields:
{
  "title": "A compelling devotion title (6-10 words)",
  "scriptureReference": "Book Chapter:Verse(s)",
  "scriptureText": "The full scripture text in ${translation}",
  "keyTheme": "2-4 word theme label",
  "devotionalBody": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "lifeApplication": "A concrete, personal application challenge (2-3 sentences)",
  "reflectionQuestion": "A deep reflection question to journal about",
  "guidedPrayer": "A personal guided prayer (3-5 sentences)",
  "shareableQuote": "A short inspiring quote from the devotion in double quotes"
}

Requirements:
- devotionalBody must have exactly 3 paragraphs, each 3-5 sentences
- All scripture text must be accurate to the ${translation} translation
- Tone: warm, pastoral, intellectually honest — not preachy
- Focus entirely on the theme: "${topic}"`;
}

app.post('/api/devotion/generate', async (req, res) => {
  const { topic, translation } = req.body;

  if (!topic || !translation) {
    return res.status(400).json({ error: 'topic and translation are required' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: buildPrompt(topic, translation) }] }],
        generationConfig: {
          temperature: 0.85,
          topP: 0.95,
          maxOutputTokens: 1800,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini error:', err);
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip any accidental markdown fences
    const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

    let devotion;
    try {
      devotion = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse Gemini JSON:', jsonText.slice(0, 300));
      return res.status(502).json({ error: 'Malformed response from Gemini' });
    }

    res.json(devotion);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Scripture Chat endpoint ──────────────────────────────────────────────────

const SCRIPTURE_CHAT_SYSTEM = `You are a knowledgeable and spiritually sensitive Bible teacher and companion.
Help users understand, reflect on, and apply Bible passages to their lives.

Guidelines:
- Ground every response in Scripture; cite verses when relevant
- Maintain a warm, encouraging, pastoral tone
- Avoid denominational debates or controversial theological positions
- Distinguish interpretation from the direct biblical text
- Encourage personal reflection and application
- Keep responses 150–350 words unless greater depth is explicitly requested
- Use these bold section headers when the response naturally benefits from structure: **Understanding**, **Application**, **Reflection**, **Prayer**, **Related Scriptures**
- Begin naturally — no unnecessary preamble like "Great question!"`;

app.post('/api/scripture-chat', async (req, res) => {
  const { reference, context, messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini API key not configured' });
  }

  // Prepend scripture context to the very first user turn
  const contextHeader = `Scripture Reference: ${reference}\n\nPassage / Context:\n${context}\n\n---\n`;

  const geminiContents = messages.map((msg, i) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: i === 0 ? contextHeader + msg.content : msg.content }],
  }));

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SCRIPTURE_CHAT_SYSTEM }] },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.72,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini scripture-chat error:', err);
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    res.json({ content: text.trim() });
  } catch (err) {
    console.error('Scripture chat server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Devotion proxy running on port ${PORT}`));
