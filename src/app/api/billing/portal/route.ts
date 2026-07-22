import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

function getAppUrl(): string {
  let url = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';
  
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  return url.replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const { stripeCustomerId } = await req.json();

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "Missing stripeCustomerId" }, { status: 400 });
    }

    const appUrl = getAppUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/monitors`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error in portal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
