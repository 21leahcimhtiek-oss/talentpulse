import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, CheckCircle, Users, AlertCircle, ArrowUpRight } from 'lucide-react';

export const metadata = { title: 'Billing' };

const PLAN_LIMITS: Record<string, number | null> = {
  starter: 25,
  pro: null,
  enterprise: null,
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ['OKR Tracking', '360° Feedback', 'Basic Analytics', 'Email Support', 'Up to 25 employees'],
  pro: [
    'Everything in Starter',
    'AI Bias Detection',
    'AI Coaching Suggestions',
    'Team Health Scores',
    'Advanced Analytics',
    'Priority Support',
    'Unlimited Managers',
  ],
  enterprise: [
    'Everything in Pro',
    'SSO / SAML',
    'Dedicated CSM',
    '99.9% SLA',
    'Custom Integrations',
    'Audit Logs',
    'On-prem Option',
  ],
};

const PLAN_PRICES: Record<string, string> = {
  starter: '$79/mo',
  pro: '$199/mo',
  enterprise: 'Custom pricing',
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  if (userData?.role !== 'admin') redirect('/dashboard');

  const [{ data: org }, { count: employeeCount }] = await Promise.all([
    supabase.from('orgs').select('*').eq('id', userData?.org_id).single(),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userData?.org_id),
  ]);

  const plan = (org?.plan ?? 'starter') as string;
  const empLimit = PLAN_LIMITS[plan] ?? null;
  const empCount = employeeCount ?? 0;
  const usagePct = empLimit ? Math.min(Math.round((empCount / empLimit) * 100), 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and usage</p>
      </div>

      {searchParams.success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
          <CheckCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            Payment successful! Your plan has been updated. Changes take effect immediately.
          </p>
        </div>
      )}
      {searchParams.canceled && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">Checkout was canceled. No charges were made.</p>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
              Current Plan
            </p>
            <h2 className="text-xl font-bold text-gray-900 capitalize">{plan}</h2>
            <p className="text-indigo-600 font-semibold mt-0.5">{PLAN_PRICES[plan] ?? 'Custom'}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <CreditCard className="text-indigo-600" size={22} />
          </div>
        </div>
        <ul className="space-y-2 mb-6">
          {(PLAN_FEATURES[plan] ?? []).map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        {org?.stripe_customer_id && (
          <form action="/api/billing/portal" method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-lg transition-colors"
            >
              <CreditCard size={14} /> Manage Billing Portal
              <ArrowUpRight size={14} />
            </button>
          </form>
        )}
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={16} className="text-indigo-500" /> Usage
        </h3>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Employees</span>
          <span className="font-medium text-gray-900">
            {empCount}
            {empLimit ? ` / ${empLimit}` : ' (unlimited)'}
          </span>
        </div>
        {empLimit && (
          <>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePct >= 90
                    ? 'bg-red-500'
                    : usagePct >= 70
                    ? 'bg-yellow-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{usagePct}% of limit used</p>
          </>
        )}
        {empLimit && usagePct >= 90 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={13} />
            Approaching your employee limit. Upgrade to Pro for unlimited employees.
          </div>
        )}
      </div>

      {/* Upgrade options */}
      {plan !== 'enterprise' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Upgrade Your Plan</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {plan === 'starter' && (
              <div className="border-2 border-indigo-600 rounded-xl p-5 bg-indigo-50/30">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
                  Recommended
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Pro</h4>
                <p className="text-indigo-600 font-semibold">$199/mo</p>
                <p className="text-xs text-gray-500 mt-2 mb-4 leading-relaxed">
                  Unlimited employees + all AI features including bias detection and coaching.
                </p>
                <Link
                  href="/api/billing/checkout?plan=pro"
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
            <div className="border border-gray-200 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 text-lg">Enterprise</h4>
              <p className="text-gray-600 font-semibold">Custom pricing</p>
              <p className="text-xs text-gray-500 mt-2 mb-4 leading-relaxed">
                SSO, dedicated CSM, 99.9% SLA, and custom integrations.
              </p>
              <a
                href="mailto:sales@aurorarayes.com"
                className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}