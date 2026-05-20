/**
 * Supabase Edge Function — create-razorpay-order
 *
 * Deploy:
 *   supabase functions deploy create-razorpay-order --no-verify-jwt=false
 *
 * Required secrets:
 *   supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx
 *   supabase secrets set RAZORPAY_KEY_SECRET=xxx
 *
 * The `--no-verify-jwt=false` flag means Supabase verifies the user's JWT
 * before this function runs, so we can trust `req.headers.authorization`.
 */

// @ts-expect-error Deno runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = {
  plan: 'monthly' | 'annual' | 'lifetime';
  amount: number; // paise
  currency: 'INR';
};

const ALLOWED_AMOUNTS: Record<string, number> = {
  monthly: 19900,
  annual: 149900,
  lifetime: 499900,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = (await req.json()) as Body;
    const expected = ALLOWED_AMOUNTS[body.plan];
    if (!expected || expected !== body.amount) {
      return new Response(JSON.stringify({ error: 'Invalid plan or amount.' }), {
        status: 400,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    // @ts-expect-error Deno
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    // @ts-expect-error Deno
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay keys missing.' }), {
        status: 500,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount: body.amount,
        currency: body.currency,
        receipt: `mm_${Date.now()}`,
        notes: { plan: body.plan },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      return new Response(JSON.stringify({ error: order }), {
        status: 502,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(order), {
      headers: { ...cors, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  }
});
