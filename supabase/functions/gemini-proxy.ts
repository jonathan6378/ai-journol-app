/**
 * Supabase Edge Function — gemini-proxy
 *
 * The trusted server-side façade for Google Gemini. The mobile client posts
 * a prompt + generation config; this function calls Gemini using the
 * `GEMINI_API_KEY` secret that never leaves Supabase.
 *
 * Contract — matches what `src/lib/gemini.ts` sends:
 *   POST /functions/v1/gemini-proxy
 *   Authorization: Bearer <user JWT>          // verified by Supabase
 *   Body: {
 *     prompt:  string,
 *     jsonMode: boolean,
 *     model?:  string                          // defaults to env GEMINI_MODEL
 *   }
 *
 * Returns:
 *   200 { text: string }                       // raw text from Gemini
 *   429 { error: 'rate_limited' }              // see RATE_LIMIT below
 *   401 { error: 'unauthorized' }
 *   5xx { error: string }
 *
 * Deploy:
 *   supabase secrets set GEMINI_API_KEY=AI...
 *   supabase secrets set GEMINI_MODEL=gemini-1.5-flash
 *   # SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected.
 *   supabase functions deploy gemini-proxy
 */

// @ts-expect-error Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Deno bundler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });

// --- Cheap in-memory rate limit ----------------------------------------
// Per-instance, per-user. 30 reqs / 60s. Good enough to soak up runaway
// loops; not a substitute for a real per-account quota in postgres.
const RATE_LIMIT = { windowMs: 60_000, max: 30 };
const buckets = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const list = (buckets.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (list.length >= RATE_LIMIT.max) {
    buckets.set(userId, list);
    return true;
  }
  list.push(now);
  buckets.set(userId, list);
  return false;
}

type Body = {
  prompt?: string;
  jsonMode?: boolean;
  model?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  try {
    // --- Auth: verify the user JWT --------------------------------------
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json(401, { error: 'unauthorized' });

    // @ts-expect-error Deno
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    // @ts-expect-error Deno
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    if (!supabaseUrl || !serviceKey) {
      return json(500, { error: 'server_misconfigured' });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { error: 'unauthorized' });
    }
    const userId = userData.user.id;

    // --- Rate limit ----------------------------------------------------
    if (rateLimited(userId)) {
      return json(429, { error: 'rate_limited' });
    }

    // --- Validate input ------------------------------------------------
    const body = (await req.json().catch(() => null)) as Body | null;
    const prompt = body?.prompt?.trim();
    if (!prompt || prompt.length > 16_000) {
      return json(400, { error: 'invalid_prompt' });
    }
    const jsonMode = !!body?.jsonMode;

    // @ts-expect-error Deno
    const apiKey = Deno.env.get('GEMINI_API_KEY') as string;
    if (!apiKey) return json(500, { error: 'gemini_not_configured' });
    // @ts-expect-error Deno
    const defaultModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash';
    const model = body?.model?.match(/^[a-z0-9.\-]+$/i)
      ? body.model
      : defaultModel;

    // --- Call Gemini ---------------------------------------------------
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return json(502, { error: `gemini_${upstream.status}`, detail: text.slice(0, 200) });
    }

    const result = await upstream.json();
    const blocked = result?.promptFeedback?.blockReason;
    if (blocked) {
      return json(200, {
        text:
          jsonMode
            ? JSON.stringify({
                summary: "I want to be careful here. Let's come back to this another time.",
                insight: '',
                question: 'What do you need most right now?',
                detected_emotions: [],
                detected_mood: null,
              })
            : "I want to be careful here. Let's come back to this another time.",
        blocked: true,
      });
    }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return json(200, { text });
  } catch (e) {
    return json(500, { error: 'internal_error', detail: String(e).slice(0, 200) });
  }
});
