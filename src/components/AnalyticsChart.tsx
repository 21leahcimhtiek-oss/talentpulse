'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '@/lib/utils';

interface Props {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey: string;
  color?: string;
}

export default function AnalyticsChart({ data, dataKey, xKey, color = '#6366f1' }: Props) {
  const formatted = data.map(d => ({
    ...d,
    [xKey]: formatDate(d[xKey] as string),
  }));

  if (!data.length) {
    return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet.</div>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ fontWeight: 600, color: '#1e293b' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}