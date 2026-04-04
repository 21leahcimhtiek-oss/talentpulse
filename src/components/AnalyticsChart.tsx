'use client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';

type ChartType = 'line' | 'bar' | 'area';

interface DataPoint {
  label: string;
  [key: string]: string | number;
}

interface Series {
  key: string;
  name: string;
  color: string;
}

interface AnalyticsChartProps {
  type: ChartType;
  data: DataPoint[];
  series: Series[];
  title?: string;
  height?: number;
  yAxisLabel?: string;
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
};

const axisStyle = { fontSize: 11, fill: '#9ca3af' };

export default function AnalyticsChart({
  type,
  data,
  series,
  title,
  height = 280,
  yAxisLabel,
}: AnalyticsChartProps) {
  const commonProps = {
    data,
    margin: { top: 10, right: 16, left: yAxisLabel ? 24 : 4, bottom: 0 },
  };

  const xAxis = <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />;
  const yAxis = (
    <YAxis
      tick={axisStyle}
      tickLine={false}
      axisLine={false}
      label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } } : undefined}
    />
  );
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />;
  const tooltip = <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />;
  const legend = (
    <Legend
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
    />
  );

  function renderChart() {
    if (type === 'bar') {
      return (
        <BarChart {...commonProps}>
          {grid}{xAxis}{yAxis}{tooltip}{legend}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={48} />
          ))}
        </BarChart>
      );
    }
    if (type === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {grid}{xAxis}{yAxis}{tooltip}{legend}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      );
    }
    // default: line
    return (
      <LineChart {...commonProps}>
        {grid}{xAxis}{yAxis}{tooltip}{legend}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {title && <h3 className="font-semibold text-gray-900 text-sm mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}