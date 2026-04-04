import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${(err as Error).message}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { supabase_user_id, plan, billing } = session.metadata ?? {};
      if (supabase_user_id && plan) {
        await supabase.from('subscriptions').upsert({
          user_id: supabase_user_id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_tier: plan,
          billing_period: billing,
          status: 'active',
        }, { onConflict: 'user_id' });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from('subscriptions').update({
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}