import { cn } from '@/lib/utils';

interface OKRProgressProps {
  current: number;
  target: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function OKRProgress({
  current,
  target,
  unit = '%',
  size = 'md',
  showLabel = true,
}: OKRProgressProps) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const heightClass = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3' }[size];

  const barColor =
    percent >= 100
      ? 'bg-blue-500'
      : percent >= 70
      ? 'bg-green-500'
      : percent >= 40
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>
            {current} / {target} {unit}
          </span>
          <span className="font-medium">{percent}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}