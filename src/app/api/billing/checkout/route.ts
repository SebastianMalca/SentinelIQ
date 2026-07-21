import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();
    const userId = session.user.id;
    
    // Mapeo simple de planes a Price IDs (estos vendrían de Stripe Dashboard)
    const priceIdMap: Record<string, string> = {
      'PRO': process.env.STRIPE_PRICE_PRO || 'price_123',
      'BUSINESS': process.env.STRIPE_PRICE_BUSINESS || 'price_456'
    };

    if (!priceIdMap[plan]) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // Crear la sesión de Checkout de Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceIdMap[plan],
          quantity: 1,
        },
      ],
      // client_reference_id es lo que el webhook usa para identificar al usuario
      client_reference_id: userId,
      metadata: {
        userId: userId,
        plan: plan
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/monitors?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating stripe checkout:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
