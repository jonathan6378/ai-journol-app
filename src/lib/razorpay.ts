/**
 * Razorpay service.
 *
 * SECURITY NOTE: In production, the order MUST be created on a trusted server
 * (e.g. Supabase Edge Function) using your KEY_SECRET, then returned to the
 * client. The client should NEVER hold the secret.
 *
 * For local development we expose a `createOrderLocally` helper that calls a
 * Supabase Edge Function named `create-razorpay-order`. A reference
 * implementation lives at `supabase/functions/create-razorpay-order.ts`.
 */

import RazorpayCheckout from 'react-native-razorpay';
import { env, hasRazorpay } from './env';
import { supabase } from './supabase';
import { profileApi } from './api/profile';

export type PlanId = 'monthly' | 'annual' | 'lifetime';

export type Plan = {
  id: PlanId;
  label: string;
  amountPaise: number; // INR paise
  cadence: string;
  perks: string;
  bestValue?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    amountPaise: 19900,
    cadence: '/month',
    perks: 'Cancel anytime',
  },
  {
    id: 'annual',
    label: 'Annual',
    amountPaise: 149900,
    cadence: '/year',
    perks: 'Save 37%',
    bestValue: true,
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    amountPaise: 499900,
    cadence: 'one-time',
    perks: 'Pay once, keep forever',
  },
];

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

/**
 * Calls the Supabase Edge Function that creates a server-side order.
 * The function is responsible for:
 *   - authenticating the user via the bearer token
 *   - hitting Razorpay /v1/orders with the secret key
 *   - returning the order id back to the client
 */
async function createOrder(plan: Plan): Promise<RazorpayOrder> {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { plan: plan.id, amount: plan.amountPaise, currency: 'INR' },
  });
  if (error) throw error;
  if (!data?.id) throw new Error('Order creation failed.');
  return data as RazorpayOrder;
}

function planEndDate(plan: PlanId): string | null {
  const now = new Date();
  if (plan === 'monthly') {
    now.setMonth(now.getMonth() + 1);
    return now.toISOString();
  }
  if (plan === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
    return now.toISOString();
  }
  return null; // lifetime
}

export async function purchasePlan(opts: {
  plan: Plan;
  user: { id: string; email: string | null; full_name: string | null };
}): Promise<{ success: true } | { success: false; error: string }> {
  if (!hasRazorpay) {
    return { success: false, error: 'Razorpay key not configured.' };
  }

  try {
    const order = await createOrder(opts.plan);

    const result = (await RazorpayCheckout.open({
      key: env.razorpayKeyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'MindMirror',
      description: `${opts.plan.label} plan`,
      prefill: {
        email: opts.user.email ?? '',
        name: opts.user.full_name ?? '',
      },
      theme: { color: '#A78BFA' },
    })) as RazorpaySuccess;

    const endsAt = planEndDate(opts.plan.id);

    // Persist subscription record. Server-side webhook should also verify
    // the signature, but we record it here for instant UX.
    await supabase.from('subscriptions').insert({
      user_id: opts.user.id,
      razorpay_payment_id: result.razorpay_payment_id,
      razorpay_order_id: result.razorpay_order_id,
      razorpay_signature: result.razorpay_signature,
      plan: opts.plan.id,
      amount: opts.plan.amountPaise,
      currency: 'INR',
      status: 'captured',
      ends_at: endsAt,
    });

    await profileApi.setPremium(opts.user.id, endsAt);

    return { success: true };
  } catch (err: any) {
    // Razorpay throws an object: { code, description }
    const message =
      err?.description || err?.message || 'Payment was cancelled or failed.';
    return { success: false, error: String(message) };
  }
}

export function formatPrice(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}
