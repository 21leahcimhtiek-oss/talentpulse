interface Props {
  progress: number;
  className?: string;
}

export default function OKRProgress({ progress, className = '' }: Props) {
  const clamped = Math.max(0, Math.min(100, progress));
  const color = clamped >= 80 ? 'bg-green-500' : clamped >= 50 ? 'bg-primary-500' : clamped >= 25 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className={`w-full h-2 bg-slate-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}