'use client';
import { useState } from 'react';
import { Check, Loader2, Zap, Building2, Rocket } from 'lucide-react';

interface Plan {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$79',
    description: 'Perfect for small teams getting started with performance analytics.',
    icon: <Rocket size={20} />,
    cta: 'Get Started',
    features: [
      'Up to 25 employees',
      'OKR tracking',
      '360 Feedback',
      'Basic analytics dashboard',
      'Email support',
      '3 months data retention',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$199',
    description: 'For growing teams that need AI-powered insights and coaching.',
    icon: <Zap size={20} />,
    highlight: true,
    cta: 'Upgrade to Pro',
    features: [
      'Up to 200 employees',
      'Everything in Starter',
      'AI coaching suggestions',
      'Bias detection in reviews',
      'Team health gauges',
      'Advanced analytics & exports',
      'Priority email & chat support',
      '12 months data retention',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations needing custom integrations and SLAs.',
    icon: <Building2 size={20} />,
    cta: 'Contact Sales',
    features: [
      'Unlimited employees',
      'Everything in Pro',
      'SSO / SAML integration',
      'Custom data retention',
      'Dedicated success manager',
      'SLA & uptime guarantee',
      'Custom AI model fine-tuning',
      'Audit logs & compliance exports',
    ],
  },
];

interface BillingPlansProps {
  currentPlan: string;
}

export default function BillingPlans({ currentPlan }: BillingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planId: 'starter' | 'pro' | 'enterprise') {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@aurorarayes.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isLoading = loading === plan.id;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
              plan.highlight
                ? 'border-indigo-400 shadow-lg shadow-indigo-100 bg-white'
                : 'border-gray-200 bg-white hover:shadow-md'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              plan.highlight ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {plan.icon}
            </div>

            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              {isCurrent && (
                <span className="text-xs font-medium bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  Current Plan
                </span>
              )}
            </div>

            <div className="flex items-end gap-1 mb-2">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              {plan.price !== 'Custom' && (
                <span className="text-sm text-gray-400 mb-1">/month</span>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-5 leading-relaxed">{plan.description}</p>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check size={15} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-500' : 'text-green-500'}`} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={isCurrent || isLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${
                isCurrent
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : plan.highlight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isCurrent ? 'Current Plan' : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}