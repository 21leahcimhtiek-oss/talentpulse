import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLAN_PRICE_IDS } from '@/lib/stripe/client';
import { rateLimit } from '@/lib/rate-limit';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro']),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await rateLimit(`billing:checkout:${ip}`);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
    }

    const body = await request.json() as unknown;
    const validated = checkoutSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const { data: org } = await supabase
      .from('orgs')
      .select('stripe_customer_id, name')
      .eq('id', userData.org_id)
      .single();

    let customerId = org?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  org?.name ?? undefined,
        metadata: { org_id: userData.org_id, user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('orgs')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.org_id);
    }

    const priceId = PLAN_PRICE_IDS[validated.data.plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      mode:                 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata:    { org_id: userData.org_id, plan: validated.data.plan },
      subscription_data: {
        metadata: { org_id: userData.org_id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}