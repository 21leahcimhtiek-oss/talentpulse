import { createClient } from '@/lib/supabase/server';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const metadata = { title: 'Team Health' };

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'text-green-600 bg-green-50 border-green-200'
      : score >= 50
      ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
      : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div
      className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 font-bold text-lg ${color}`}
    >
      {score}
    </div>
  );
}

function TrendBadge({ trend }: { trend: number }) {
  if (trend > 2)
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <TrendingUp size={13} /> +{Math.round(trend)}
      </span>
    );
  if (trend < -2)
    return (
      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
        <TrendingDown size={13} /> {Math.round(trend)}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
      <Minus size={13} /> Stable
    </span>
  );
}

type HealthRecord = {
  id: string;
  team_id: string;
  team_name: string | null;
  composite_score: number;
  okr_score: number | null;
  feedback_score: number | null;
  review_score: number | null;
  date: string;
};

export default async function TeamHealthPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user!.id)
    .single();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: healthData } = await supabase
    .from('team_health')
    .select('*')
    .eq('org_id', userData?.org_id)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false });

  const records = (healthData ?? []) as HealthRecord[];
  const teams = [...new Set(records.map((h) => h.team_id))];

  const teamStats = teams.map((teamId) => {
    const teamRecords = records.filter((h) => h.team_id === teamId);
    const latest = teamRecords[0];
    const weekAgoRecord = teamRecords.find((h) => h.date < sevenDaysAgo);
    const trend =
      latest && weekAgoRecord != null
        ? (latest.composite_score ?? 0) - (weekAgoRecord.composite_score ?? 0)
        : 0;
    return {
      teamId,
      teamName: latest?.team_name ?? teamId,
      latest,
      trend,
      records: teamRecords,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Health</h1>
        <p className="text-gray-500 mt-1">
          Composite scores across OKR attainment, peer feedback, and review ratings
        </p>
      </div>

      {teamStats.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-200">
          <Activity size={44} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-lg">No team health data available</p>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
            Health scores are calculated automatically once you have OKRs, reviews, and feedback in the system.
          </p>
        </div>
      ) : (
        <>
          {/* Team score cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamStats.map(({ teamId, teamName, latest, trend }) => (
              <div key={teamId} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{teamName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
                  </div>
                  <TrendBadge trend={trend} />
                </div>
                {latest ? (
                  <>
                    <div className="flex items-center gap-4 mb-5">
                      <ScoreRing score={Math.round(latest.composite_score ?? 0)} />
                      <div>
                        <p className="text-xs text-gray-400">Composite score</p>
                        <p className="text-sm text-gray-600 mt-0.5">out of 100</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: 'OKR Score', value: latest.okr_score },
                        { label: 'Feedback Score', value: latest.feedback_score },
                        { label: 'Review Score', value: latest.review_score },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-indigo-400 h-1.5 rounded-full"
                              style={{ width: `${Math.min(value ?? 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {value ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No recent data</p>
                )}
              </div>
            ))}
          </div>

          {/* Factor breakdown table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Factor Breakdown by Team</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Team
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      OKR Score
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Feedback
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Reviews
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Composite
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamStats.map(({ teamId, teamName, latest, trend }) => (
                    <tr key={teamId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{teamName}</td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {latest?.okr_score ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {latest?.feedback_score ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {latest?.review_score ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {latest ? Math.round(latest.composite_score ?? 0) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TrendBadge trend={trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}