import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when env vars are not set.
// In serverless environments (Vercel), env vars are only available at runtime, not during build.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
    }
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

// Keep backward-compatible export using a Proxy so existing `stripe.xxx` calls work
// without needing to change every import site to `getStripe().xxx`
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
