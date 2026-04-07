import { createClient } from '@/lib/supabase/server';
import { getHealthScoreColor, getHealthScoreLabel } from '@/lib/utils';
import AnalyticsChart from '@/components/AnalyticsChart';
import TeamHealthGauge from '@/components/TeamHealthGauge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { count: employeeCount },
    { data: okrs },
    { data: healthScores },
    { data: pendingReviews },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('okrs').select('progress, status').limit(50),
    supabase.from('team_health_scores').select('*').order('calculated_at', { ascending: false }).limit(30),
    supabase.from('performance_reviews').select('*', { count: 'exact', head: true }).is('submitted_at', null),
  ]);

  const avgOKRProgress = okrs?.length
    ? Math.round(okrs.reduce((s, o) => s + o.progress, 0) / okrs.length)
    : 0;
  const atRiskOKRs = okrs?.filter(o => o.status === 'at_risk').length ?? 0;
  const latestHealth = healthScores?.[0]?.score ?? 0;

  const kpis = [
    { label: 'Active Employees', value: employeeCount ?? 0, icon: 'ðŸ‘¥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Avg OKR Progress', value: `${avgOKRProgress}%`, icon: 'ðŸŽ¯', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'At-Risk OKRs', value: atRiskOKRs, icon: 'âš ï¸', color: 'bg-amber-50 text-amber-700' },
    { label: 'Pending Reviews', value: pendingReviews ?? 0, icon: 'ðŸ“‹', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good morning{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} ðŸ‘‹
        </h1>
        <p className="text-slate-500 mt-1">Here is your team performance snapshot.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Team Health Trend</h2>
          <AnalyticsChart data={healthScores ?? []} dataKey="score" xKey="calculated_at" color="#6366f1" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
          <h2 className="text-base font-semibold text-slate-900 mb-4 self-start">Current Health Score</h2>
          <TeamHealthGauge score={latestHealth} />
          <p className={`mt-3 font-semibold text-lg ${getHealthScoreColor(latestHealth)}`}>
            {getHealthScoreLabel(latestHealth)}
          </p>
        </div>
      </div>
    </div>
  );
}