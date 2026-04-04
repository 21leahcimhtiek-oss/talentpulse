import { createClient } from '@/lib/supabase/server';
import { Users, TrendingUp, ClipboardList, Activity } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className={`${color} h-1.5 rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('*, orgs(name)')
    .eq('id', user!.id)
    .single();

  const [
    { count: employeeCount },
    { data: okrs },
    { count: reviewCount },
    { data: healthScores },
    { data: atRiskOkrs },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userData?.org_id),
    supabase
      .from('okrs')
      .select('status, progress, title, due_date, users(full_name)')
      .eq('org_id', userData?.org_id),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', userData?.org_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('team_health')
      .select('composite_score')
      .eq('org_id', userData?.org_id)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('okrs')
      .select('title, progress, due_date, users(full_name)')
      .eq('org_id', userData?.org_id)
      .eq('status', 'at_risk')
      .order('due_date')
      .limit(5),
  ]);

  const totalOkrs = okrs?.length ?? 0;
  const onTrackOkrs = okrs?.filter((o) => o.status === 'on_track').length ?? 0;
  const onTrackPct = totalOkrs > 0 ? Math.round((onTrackOkrs / totalOkrs) * 100) : 0;

  const avgHealth =
    healthScores && healthScores.length > 0
      ? Math.round(
          healthScores.reduce((sum, s) => sum + (s.composite_score ?? 0), 0) /
            healthScores.length,
        )
      : 0;

  const orgName = (userData?.orgs as { name: string } | null)?.name ?? 'Your Organization';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">{orgName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={String(employeeCount ?? 0)}
          color="bg-indigo-500"
        />
        <StatCard
          icon={TrendingUp}
          label="OKRs On Track"
          value={`${onTrackPct}%`}
          sub={`${onTrackOkrs} of ${totalOkrs}`}
          color="bg-green-500"
        />
        <StatCard
          icon={ClipboardList}
          label="Reviews (30d)"
          value={String(reviewCount ?? 0)}
          color="bg-purple-500"
        />
        <StatCard
          icon={Activity}
          label="Avg Team Health"
          value={avgHealth > 0 ? `${avgHealth}/100` : '—'}
          sub="Last 7 days"
          color="bg-orange-500"
        />
      </div>

      {atRiskOkrs && atRiskOkrs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" />
            At-Risk OKRs
          </h2>
          <div className="space-y-4">
            {atRiskOkrs.map((okr, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{okr.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(okr.users as { full_name: string } | null)?.full_name ?? 'Unknown'} &middot;{' '}
                    Due {okr.due_date ? new Date(okr.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="w-32 flex-shrink-0">
                  <ProgressBar value={okr.progress ?? 0} />
                  <p className="text-xs text-gray-400 text-right mt-1">{okr.progress ?? 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!atRiskOkrs || atRiskOkrs.length === 0) && totalOkrs === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <TrendingUp size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No data yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Add employees and create OKRs to see your dashboard come alive.
          </p>
        </div>
      )}
    </div>
  );
}