import { createClient } from '@/lib/supabase/server';
import TeamHealthGauge from '@/components/TeamHealthGauge';
import AnalyticsChart from '@/components/AnalyticsChart';
import { getHealthScoreColor, getHealthScoreLabel, formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Team Health' };

export default async function TeamHealthPage() {
  const supabase = createClient();
  const { data: scores } = await supabase
    .from('team_health_scores')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(30);

  const latest = scores?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Health</h1>
        <p className="text-slate-500 mt-1">Composite score from engagement, OKR attainment, and feedback sentiment.</p>
      </div>

      {latest && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center">
            <TeamHealthGauge score={latest.score as number} />
            <p className={`mt-2 font-semibold ${getHealthScoreColor(latest.score as number)}`}>
              {getHealthScoreLabel(latest.score as number)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Overall Score</p>
          </div>
          {[
            { label: 'Engagement', value: latest.engagement_score as number },
            { label: 'OKR Attainment', value: latest.okr_attainment as number },
            { label: 'Feedback Sentiment', value: latest.feedback_sentiment as number },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">{m.label}</p>
              <p className={`text-3xl font-bold mt-2 ${getHealthScoreColor(m.value)}`}>{m.value}</p>
              <p className="text-xs text-slate-400 mt-1">/100</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">30-Day Trend</h2>
        <AnalyticsChart data={scores?.slice().reverse() ?? []} dataKey="score" xKey="calculated_at" color="#6366f1" />
      </div>
    </div>
  );
}