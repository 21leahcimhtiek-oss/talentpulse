import { createClient } from '@/lib/supabase/server';
import BillingPlans from '@/components/BillingPlans';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Billing' };

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id ?? '').single();
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', (profile as { org_id?: string })?.org_id ?? '')
    .single();

  const sub = subscription as { plan_tier?: string; status?: string; current_period_end?: string } | null;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing &amp; Plans</h1>
        <p className="text-slate-500 mt-1">Manage your subscription and payment details.</p>
      </div>

      {sub && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Current Plan</h2>
          <div className="flex items-center gap-4">
            <span className="capitalize text-lg font-bold text-primary-700">{sub.plan_tier ?? 'Free'}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {sub.status}
            </span>
          </div>
          {sub.current_period_end && (
            <p className="text-sm text-slate-500 mt-2">Renews {formatDate(sub.current_period_end)}</p>
          )}
          <form action="/api/billing/portal" method="POST" className="mt-4">
            <button type="submit" className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors">
              Manage in Stripe Portal
            </button>
          </form>
        </div>
      )}

      <BillingPlans currentPlan={(sub?.plan_tier as 'starter' | 'pro' | null) ?? null} />
    </div>
  );
}