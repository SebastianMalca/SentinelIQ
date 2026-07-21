import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { stripeCustomerId } = await req.json();

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "Missing stripeCustomerId" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in portal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
