/**
 * Supabase Edge Function — send-daily-nudge
 *
 * Run on a cron schedule (every 30 minutes is plenty). For each user whose
 * local notification_hour matches the current hour and whose token is fresh,
 * we:
 *   1. Pull recent entries + memory.
 *   2. Ask Gemini for a single-line, MindMirror-voiced nudge.
 *   3. Send via Expo's push API.
 *   4. Log the send + bump profiles.last_notified_at to de-dupe.
 *
 * Schedule (Supabase dashboard → Database → Cron Jobs):
 *   */30 * * * *   call POST /functions/v1/send-daily-nudge with the
 *                  service-role key
 *
 * Required secrets:
 *   GEMINI_API_KEY    — same key used by gemini-proxy
 *   GEMINI_MODEL      — defaults to gemini-1.5-flash
 *
 * Authorization: this function is INTERNAL. It expects the service-role key
 * in the Authorization header. Don't expose it to clients.
 */

// @ts-expect-error Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error Deno bundler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Profile = {
  id: string;
  full_name: string | null;
  expo_push_token: string | null;
  notifications_enabled: boolean;
  notification_hour: number;
  last_notified_at: string | null;
  timezone: string | null;
};

type Entry = {
  created_at: string;
  body: string;
  mood: string | null;
  emotions: string[];
};

type MemoryNote = {
  content: string;
  category: string;
};

const PERSONA = `
You are MindMirror — a private emotional companion.
Write a single push-notification line, under 70 characters.

Voice rules:
- Speak like a wise, gentle friend.
- Never start with "Based on", "It seems", "I notice", "I understand".
- No clinical language. No emojis. No weather metaphors.
- It's OK to be specific, but stay vague enough that a glance at a lockscreen feels safe.

Examples of the right tone:
- "Take a moment for yourself today."
- "You seemed calmer after journaling last week."
- "Your evenings have been heavy. Want to talk?"

Return ONLY plain text, no quotes, no JSON.
`.trim();

const FALLBACKS = [
  'A small pause for yourself.',
  "There's space here when you're ready.",
  'How is today landing?',
  'A quiet minute, if you have one.',
];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function pickFallback(): string {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

async function generateCopy(
  apiKey: string,
  model: string,
  memory: MemoryNote[],
  daysSinceLastEntry: number | null,
): Promise<string> {
  const memBlock = memory.slice(0, 4).map((m) => `- ${m.content}`).join('\n') || '(no memory)';
  const prompt = `${PERSONA}

Memory:
${memBlock}
Days since last entry: ${daysSinceLastEntry ?? 'unknown'}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 64,
          responseMimeType: 'text/plain',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });
    if (!res.ok) return pickFallback();
    const result = await res.json();
    if (result?.promptFeedback?.blockReason) return pickFallback();
    const text = (result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!text || text.length > 90) return pickFallback();
    return text;
  } catch {
    return pickFallback();
  }
}

type ExpoTicket = { id?: string; status?: 'ok' | 'error'; message?: string };

async function sendExpoPush(token: string, body: string): Promise<ExpoTicket> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title: 'MindMirror',
        body,
        sound: null,
        priority: 'normal',
        channelId: 'mindmirror-default',
      }),
    });
    const data = await res.json().catch(() => null);
    return (data?.data ?? data) as ExpoTicket;
  } catch (e) {
    return { status: 'error', message: String(e) };
  }
}

/**
 * Returns the user's *local* hour given a profile timezone (IANA string).
 * If the timezone column is missing we conservatively use UTC. The store
 * UI nudges users to set this on first launch (TODO).
 */
function localHourFor(profile: Profile, now: Date): number {
  const tz = profile.timezone ?? 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      hour: 'numeric',
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return now.getUTCHours();
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  // Verify the caller is using the service role key (set as env var on the
  // Cron Job that calls us). This function is not exposed to end users.
  // @ts-expect-error Deno
  const expectedAuth = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  const provided = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!expectedAuth || provided !== expectedAuth) {
    return json(401, { error: 'unauthorized' });
  }

  // @ts-expect-error Deno
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabase = createClient(supabaseUrl, expectedAuth);

  // @ts-expect-error Deno
  const apiKey = Deno.env.get('GEMINI_API_KEY') as string;
  // @ts-expect-error Deno
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash';

  const now = new Date();

  // Pull all opted-in users with a token. We filter by local hour in JS.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, expo_push_token, notifications_enabled, notification_hour, last_notified_at, timezone')
    .eq('notifications_enabled', true)
    .not('expo_push_token', 'is', null);

  if (error) return json(500, { error: 'profiles_query_failed', detail: error.message });

  const due = (profiles as Profile[]).filter((p) => {
    if (!p.expo_push_token) return false;
    const localHour = localHourFor(p, now);
    if (localHour !== p.notification_hour) return false;
    // De-dupe: don't send twice in the same hour.
    if (p.last_notified_at) {
      const last = new Date(p.last_notified_at);
      if (now.getTime() - last.getTime() < 23 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  const results: Array<{ user_id: string; status: string }> = [];

  for (const p of due) {
    // Most recent entry → days since
    const { data: lastEntry } = await supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', p.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<Entry>();

    const daysSince = lastEntry
      ? Math.floor((now.getTime() - new Date(lastEntry.created_at).getTime()) / 86_400_000)
      : null;

    const { data: memory } = await supabase
      .from('memory_notes')
      .select('content, category')
      .eq('user_id', p.id)
      .order('weight', { ascending: false })
      .limit(4);

    const body = apiKey
      ? await generateCopy(apiKey, model, (memory ?? []) as MemoryNote[], daysSince)
      : pickFallback();

    const ticket = await sendExpoPush(p.expo_push_token!, body);

    await supabase.from('notifications_log').insert({
      user_id: p.id,
      body,
      kind: 'daily_nudge',
      expo_ticket_id: ticket?.id ?? null,
    });

    await supabase
      .from('profiles')
      .update({ last_notified_at: now.toISOString() })
      .eq('id', p.id);

    results.push({ user_id: p.id, status: ticket?.status ?? 'unknown' });
  }

  return json(200, { sent: results.length, results });
});
