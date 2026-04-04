import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { stripe } from '@/lib/stripe/client';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    Sentry.captureException(err, { tags: { source: 'stripe_webhook' } });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        const orgId = session.metadata?.org_id;
        const plan = session.metadata?.plan;
        if (orgId && plan) {
          await serviceClient
            .from('orgs')
            .update({
              plan,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', orgId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        const status = subscription.status;
        if (orgId) {
          const plan = status === 'active'
            ? (subscription.metadata?.plan ?? 'starter')
            : 'starter';
          await serviceClient
            .from('orgs')
            .update({ plan, stripe_subscription_id: subscription.id })
            .eq('id', orgId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.org_id;
        if (orgId) {
          await serviceClient
            .from('orgs')
            .update({ plan: 'starter', stripe_subscription_id: null })
            .eq('id', orgId);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error, { tags: { source: 'stripe_webhook', event_type: event.type } });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export const config = { api: { bodyParser: false } };