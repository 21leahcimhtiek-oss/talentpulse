'use client';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TeamHealthGaugeProps {
  teamId: string;
  teamName?: string;
  score: number;
  factors?: Record<string, number>;
  trend?: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Needs Attention';
  return 'At Risk';
}

const factorLabels: Record<string, string> = {
  okr_score: 'OKR Progress',
  feedback_score: '360 Feedback',
  review_score: 'Review Score',
  engagement_score: 'Engagement',
  retention_score: 'Retention',
};

export default function TeamHealthGauge({ teamId: _teamId, teamName, score, factors, trend }: TeamHealthGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const color = getScoreColor(clampedScore);
  const data = [{ value: clampedScore, fill: color }];

  const trendIcon =
    trend === undefined || trend === 0 ? (
      <Minus size={14} className="text-gray-400" />
    ) : trend > 0 ? (
      <TrendingUp size={14} className="text-green-500" />
    ) : (
      <TrendingDown size={14} className="text-red-500" />
    );

  const trendText =
    trend === undefined || trend === 0
      ? 'Stable'
      : `${trend > 0 ? '+' : ''}${trend.toFixed(1)} pts`;

  const factorKeys = factors ? Object.keys(factors).slice(0, 5) : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {teamName && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">{teamName}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            clampedScore >= 70 ? 'bg-green-50 text-green-700 border-green-200' :
            clampedScore >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {getScoreLabel(clampedScore)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-center flex-col gap-1 relative">
        <RadialBarChart
          width={160}
          height={100}
          cx={80}
          cy={90}
          innerRadius={55}
          outerRadius={75}
          barSize={14}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={7} background={{ fill: '#f3f4f6' }} />
        </RadialBarChart>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className={`text-3xl font-bold ${getScoreBg(clampedScore)}`}>{clampedScore}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
        {trendIcon}
        <span>{trendText}</span>
      </div>

      {factorKeys.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Breakdown</p>
          {factorKeys.map((key) => {
            const val = Math.min(100, Math.max(0, factors![key]));
            return (
              <div key={key} className="space-y-0.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{factorLabels[key] || key}</span>
                  <span className="font-medium">{val}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${val}%`, backgroundColor: getScoreColor(val) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}