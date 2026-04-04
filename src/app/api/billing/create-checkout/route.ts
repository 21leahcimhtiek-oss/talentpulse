import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe/client';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'checkout', 5);
  if (limited) return limited;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, billing = 'monthly' }: { plan: 'starter' | 'pro' | 'enterprise'; billing: 'monthly' | 'annual' } = await req.json();

  const priceKey = `${plan}_${billing}` as keyof typeof STRIPE_PRICES;
  const priceId = STRIPE_PRICES[priceKey];
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('email, stripe_customer_id').eq('id', user.id).single();
  const p = profile as { email?: string; stripe_customer_id?: string } | null;

  let customerId = p?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: p?.email ?? user.email ?? '', metadata: { supabase_id: user.id } });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://talentpulse.vercel.app';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { supabase_user_id: user.id, plan, billing },
  });

  return NextResponse.json({ url: session.url });
}