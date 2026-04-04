'use client';

interface Props {
  score: number;
}

export default function TeamHealthGauge({ score }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 60;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color = clamped >= 80 ? '#22c55e' : clamped >= 60 ? '#6366f1' : clamped >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="160" height="90" viewBox="0 0 160 90" className="overflow-visible">
      <path
        d={`M 10 80 A ${radius} ${radius} 0 0 1 150 80`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={`M 10 80 A ${radius} ${radius} 0 0 1 150 80`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="80" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>
        {clamped}
      </text>
    </svg>
  );
}