import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Actualizamos la DB con el customer ID y la subscripción
        if (session.client_reference_id) {
          await prisma.user.update({
            where: { id: session.client_reference_id },
            data: {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan: 'PRO', // O mapear dinámicamente según el price_id del line_item
            }
          });
        }
        break;

      case 'invoice.payment_succeeded':
        // Aquí se puede renovar la suscripción si manejas fechas de expiración
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { stripe_subscription_id: subscription.id },
          data: {
            plan: 'FREE',
            stripe_subscription_id: null,
          }
        });
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
