import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (!customerId) return NextResponse.json({ error: 'No billing account found' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://talentpulse.vercel.app';
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.redirect(session.url);
}