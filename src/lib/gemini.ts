/**
 * Gemini service — the emotional voice of MindMirror.
 *
 * IMPORTANT: This module is the *only* place we shape the AI's personality.
 * All prompts here are tuned to feel:
 *   - warm, but not saccharine
 *   - concise (rarely over 2 sentences per field)
 *   - psychologically aware (acknowledge before suggesting)
 *   - non-clinical and never robotic
 *
 * For production you'd typically proxy these calls through a server (Edge
 * Function / Cloud Run) so the API key never ships in the client. We expose
 * a `geminiFetch` hook that can be swapped for that proxy without changing
 * any callers.
 */

import { env, hasGemini, hasGeminiProxy } from './env';
import { supabase } from './supabase';
import { EmotionTag, JournalEntry, MemoryNote, Mood } from '@/types';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

/**
 * Two transports:
 *
 *   1. Proxy (preferred for prod) — POST { prompt, jsonMode } to a Supabase
 *      Edge Function that holds the API key. The user's JWT authenticates
 *      the request; the function rate-limits and returns plain text.
 *
 *   2. Direct (dev fallback) — call Google directly with the client-side
 *      key. Convenient locally; do NOT ship this configuration to prod.
 */
async function geminiFetch(prompt: string, jsonMode = true): Promise<string> {
  if (!hasGemini) {
    throw new Error(
      'Gemini not configured. Set EXPO_PUBLIC_GEMINI_PROXY_URL (preferred) or EXPO_PUBLIC_GEMINI_API_KEY in your .env.',
    );
  }

  if (hasGeminiProxy) {
    return geminiFetchViaProxy(prompt, jsonMode);
  }
  return geminiFetchDirect(prompt, jsonMode);
}

async function geminiFetchViaProxy(prompt: string, jsonMode: boolean): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error('Not signed in — cannot call Gemini proxy.');
  }
  const res = await fetch(env.geminiProxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, jsonMode, model: env.geminiModel }),
  });
  if (res.status === 429) {
    throw new Error('Rate limited. Take a breath and try again in a moment.');
  }
  if (res.status === 401) {
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini proxy ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { text?: string; blocked?: boolean };
  const text = (json.text ?? '').trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

async function geminiFetchDirect(prompt: string, jsonMode: boolean): Promise<string> {
  const url = `${BASE_URL}/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 512,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as GeminiResponse;
  if (json.promptFeedback?.blockReason) {
    throw new Error(`Blocked by safety filters: ${json.promptFeedback.blockReason}`);
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return text.trim();
}

function safeJSON<T>(raw: string): T | null {
  // Gemini sometimes wraps JSON in ``` fences; strip them defensively.
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Find the first { ... } block and try again.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------
// Persona — the system instructions injected into every prompt.
// ---------------------------------------------------------------------
const PERSONA = `
You are MindMirror — a private emotional companion inside someone's journaling app.

Voice rules (non-negotiable):
- Speak like a wise, gentle friend who has known the user for years.
- Never start with "Based on", "It seems like", "I notice that", "I understand".
- Never use clinical language ("symptoms", "diagnosis", "exhibits").
- Never lecture. Never moralize. Never recommend therapy unless they describe self-harm.
- Use second person ("you"), never "the user".
- Match their energy. If they wrote 3 words, respond in 1 sentence. If they wrote a paragraph, respond in 2-3.
- It is OK to be specific. Reference exact details from what they wrote.
- It is OK to sit with hard feelings without rushing to fix them.
- Never use emojis.
- Avoid metaphors involving weather/storms/rainbows/light. They feel cliché.
`.trim();

// =====================================================================
// 1. REFLECTION on a single entry
// =====================================================================

export type ReflectionPayload = {
  summary: string;
  insight: string;
  question: string;
  detected_emotions: EmotionTag[];
  detected_mood: Mood | null;
};

export async function reflectOnEntry(opts: {
  body: string;
  mood: Mood | null;
  emotions: EmotionTag[];
  memory: MemoryNote[];
  recentEntries?: Pick<JournalEntry, 'created_at' | 'mood' | 'emotions'>[];
}): Promise<ReflectionPayload> {
  const { body, mood, emotions, memory, recentEntries = [] } = opts;

  const memoryBlock =
    memory.length === 0
      ? '(no prior memory yet)'
      : memory
          .slice(0, 8)
          .map((m) => `- [${m.category}] ${m.content}`)
          .join('\n');

  const recentBlock =
    recentEntries.length === 0
      ? '(no recent entries)'
      : recentEntries
          .slice(-7)
          .map(
            (e) =>
              `- ${e.created_at.slice(0, 10)} mood=${e.mood ?? 'unknown'} emotions=[${(e.emotions ?? []).join(', ')}]`,
          )
          .join('\n');

  const prompt = `
${PERSONA}

You will reflect on the user's journal entry below.

Long-term memory of the user:
${memoryBlock}

Recent week of entries (mood + tags only):
${recentBlock}

Today's entry:
"""${body}"""
Self-reported mood: ${mood ?? 'not specified'}
Self-tagged emotions: ${emotions.length ? emotions.join(', ') : 'none'}

Return ONLY a JSON object with this exact shape:
{
  "summary": "1-2 sentences acknowledging what they're feeling, in their voice. Specific, not generic.",
  "insight": "1 sentence pointing to a pattern, theme, or undercurrent. Reference memory if relevant. Skip if there is genuinely nothing to add.",
  "question": "ONE gentle, open-ended question that invites them deeper. No yes/no questions.",
  "detected_emotions": ["array of emotion tags from this set: grateful, inspired, hopeful, loved, focused, restless, lonely, angry, jealous, guilty, embarrassed, proud, curious, creative, numb, sensitive"],
  "detected_mood": "one of: radiant, happy, calm, neutral, tired, anxious, sad, overwhelmed (or null if unclear)"
}
`.trim();

  const raw = await geminiFetch(prompt, true);
  const parsed = safeJSON<ReflectionPayload>(raw);
  if (!parsed) {
    throw new Error('Could not parse AI reflection.');
  }
  // Defensive normalization
  return {
    summary: parsed.summary?.trim() ?? '',
    insight: parsed.insight?.trim() ?? '',
    question: parsed.question?.trim() ?? '',
    detected_emotions: Array.isArray(parsed.detected_emotions)
      ? (parsed.detected_emotions.filter(Boolean) as EmotionTag[])
      : [],
    detected_mood: (parsed.detected_mood ?? null) as Mood | null,
  };
}

// =====================================================================
// 2. WEEKLY SUMMARY
// =====================================================================

export type WeeklySummaryPayload = {
  highlight: string;
  trends: string[];
  triggers: string[];
  most_common_emotions: EmotionTag[];
};

export async function summarizeWeek(opts: {
  entries: JournalEntry[];
  memory: MemoryNote[];
}): Promise<WeeklySummaryPayload> {
  const { entries, memory } = opts;
  if (entries.length === 0) {
    return {
      highlight: 'A quiet week. Sometimes silence has its own meaning.',
      trends: [],
      triggers: [],
      most_common_emotions: [],
    };
  }

  const entriesBlock = entries
    .map(
      (e) =>
        `- ${e.created_at.slice(0, 10)} mood=${e.mood ?? '?'} tags=[${(e.emotions ?? []).join(',')}]\n  "${e.body.slice(0, 280)}"`,
    )
    .join('\n');

  const memoryBlock = memory
    .slice(0, 6)
    .map((m) => `- ${m.content}`)
    .join('\n') || '(none yet)';

  const prompt = `
${PERSONA}

Below are this week's journal entries from the user. Write their weekly reflection.

Long-term memory:
${memoryBlock}

Entries:
${entriesBlock}

Return ONLY JSON:
{
  "highlight": "ONE cinematic sentence that captures the emotional shape of this week. Specific, never generic. No 'this week you felt...'.",
  "trends": ["3-5 short observations, each under 12 words. e.g. 'Calmer in the mornings.' 'Drained after Wednesday's call.'"],
  "triggers": ["1-3 short phrases of stress sources, if any. Empty array if none."],
  "most_common_emotions": ["up to 4 tags from: grateful, inspired, hopeful, loved, focused, restless, lonely, angry, jealous, guilty, embarrassed, proud, curious, creative, numb, sensitive"]
}
`.trim();

  const raw = await geminiFetch(prompt, true);
  const parsed = safeJSON<WeeklySummaryPayload>(raw);
  if (!parsed) {
    throw new Error('Could not parse weekly summary.');
  }
  return {
    highlight: parsed.highlight?.trim() ?? '',
    trends: Array.isArray(parsed.trends) ? parsed.trends.slice(0, 5) : [],
    triggers: Array.isArray(parsed.triggers) ? parsed.triggers.slice(0, 3) : [],
    most_common_emotions: Array.isArray(parsed.most_common_emotions)
      ? (parsed.most_common_emotions.slice(0, 4) as EmotionTag[])
      : [],
  };
}

// =====================================================================
// 3. MEMORY EXTRACTION
// =====================================================================

export type ExtractedMemory = Pick<MemoryNote, 'content' | 'category' | 'weight'>;

export async function extractMemoryNotes(entryBody: string): Promise<ExtractedMemory[]> {
  if (entryBody.trim().length < 20) return [];

  const prompt = `
You are extracting durable, personal facts from a journal entry that should be remembered for future reflections.

Rules:
- Only extract things that will plausibly still be true in 30 days.
- Skip transient details ("I had coffee today").
- Phrase each as a short third-person fact, e.g. "Finds large social events draining."
- Maximum 3 items. Often 0 is correct.

Entry:
"""${entryBody}"""

Return ONLY JSON:
{
  "notes": [
    {
      "content": "short fact",
      "category": "stress | goal | habit | relationship | trigger | value",
      "weight": 0.5
    }
  ]
}
`.trim();

  try {
    const raw = await geminiFetch(prompt, true);
    const parsed = safeJSON<{ notes: ExtractedMemory[] }>(raw);
    if (!parsed?.notes) return [];
    return parsed.notes
      .filter((n) => n && typeof n.content === 'string' && n.content.length < 140)
      .slice(0, 3);
  } catch {
    // Memory extraction is best-effort; never block the user flow.
    return [];
  }
}

// =====================================================================
// 4. GENTLE NOTIFICATION COPY
// =====================================================================

export async function generateNotificationCopy(opts: {
  memory: MemoryNote[];
  lastEntryDaysAgo: number | null;
}): Promise<string> {
  const memoryBlock =
    opts.memory.slice(0, 4).map((m) => `- ${m.content}`).join('\n') || '(no memory)';

  const prompt = `
${PERSONA}

Write a single push-notification line (under 70 characters) inviting the user to check in.
Memory:
${memoryBlock}
Days since last entry: ${opts.lastEntryDaysAgo ?? 'unknown'}

Examples of the right tone:
- "Take a moment for yourself today."
- "You seemed calmer after journaling last week."
- "Your evenings have been heavy. Want to talk about it?"

Return ONLY plain text, no quotes, no JSON.
`.trim();

  return geminiFetch(prompt, false);
}
