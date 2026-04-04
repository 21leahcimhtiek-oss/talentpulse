import { createClient } from "@/lib/supabase/server";
import BillingPlans from "@/components/BillingPlans";
import { CreditCard, Users, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["Up to 25 employees", "OKR tracking", "Performance reviews", "360 feedback", "Basic analytics"],
  pro: ["Unlimited employees", "All Starter features", "AI bias detection", "AI coaching suggestions", "Team health scores", "Advanced analytics", "API access"],
  enterprise: ["Everything in Pro", "Custom integrations", "SAML SSO", "SLA guarantee", "Dedicated CSM"],
};

const PLAN_PRICES: Record<string, string> = {
  starter: "$79/mo",
  pro: "$199/mo",
  enterprise: "Custom",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user?.id ?? "")
    .single();

  const { data: org } = await supabase
    .from("orgs")
    .select("name, plan, stripe_customer_id")
    .eq("id", userData?.org_id ?? "")
    .single();

  const { count: employeeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });

  const currentPlan = org?.plan ?? "starter";
  const employeeLimit = currentPlan === "starter" ? 25 : -1;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and plan</p>
      </div>

      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-700 font-medium">Subscription updated successfully!</p>
        </div>
      )}

      {searchParams.canceled && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-600">Checkout canceled. Your plan has not changed.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Current Plan</h2>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-bold text-gray-900 capitalize">{currentPlan}</span>
              <span className="text-lg text-gray-500">{PLAN_PRICES[currentPlan]}</span>
            </div>
            <ul className="space-y-1">
              {PLAN_FEATURES[currentPlan]?.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Users size={14} />
              <span>
                {employeeCount ?? 0}
                {employeeLimit > 0 ? ` / ${employeeLimit}` : ""} employees
              </span>
            </div>
            {employeeLimit > 0 && (
              <div className="w-32 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, ((employeeCount ?? 0) / employeeLimit) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <BillingPlans currentPlan={currentPlan} />
    </div>
  );
}