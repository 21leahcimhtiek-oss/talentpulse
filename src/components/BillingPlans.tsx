'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  currentPlan: 'starter' | 'pro' | null;
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    monthlyPrice: 79,
    annualPrice: 63,
    description: 'For growing teams',
    features: ['Up to 50 employees', 'AI bias detection', 'OKR tracking', 'Basic analytics', 'Email support'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    monthlyPrice: 199,
    annualPrice: 159,
    description: 'For scaling organizations',
    popular: true,
    features: ['Up to 500 employees', 'All Starter features', 'AI coaching suggestions', 'Team health scoring', 'Peer 360 feedback', 'Priority support', 'API access'],
  },
];

export default function BillingPlans({ currentPlan }: Props) {
  const router = useRouter();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planId: 'starter' | 'pro') {
    setLoading(planId);
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, billing }),
    });
    const { url } = await res.json();
    if (url) router.push(url);
    else setLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBilling('monthly')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling('annual')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Annual <span className="text-xs ml-1 text-green-600 font-semibold">Save 20%</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(plan => {
          const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative bg-white border-2 rounded-2xl p-6 ${plan.popular ? 'border-primary-500' : 'border-slate-200'}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{plan.description}</p>
              <div className="mt-4 mb-5">
                <span className="text-3xl font-bold text-slate-900">${price}</span>
                <span className="text-slate-400 text-sm">/mo{billing === 'annual' ? ', billed annually' : ''}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || loading === plan.id}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                }`}
              >
                {isCurrent ? 'Current Plan' : loading === plan.id ? 'Redirecting…' : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}