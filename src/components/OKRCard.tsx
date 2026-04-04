import type { OKR } from '@/types';
import OKRProgress from './OKRProgress';

const statusColors: Record<string, string> = {
  on_track: 'bg-green-100 text-green-700',
  at_risk: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  draft: 'bg-slate-100 text-slate-500',
};

interface Props {
  okr: OKR & { employee?: { full_name?: string } };
  showEmployee?: boolean;
}

export default function OKRCard({ okr, showEmployee }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{okr.title}</p>
          {showEmployee && okr.employee && (
            <p className="text-xs text-slate-400 mt-0.5">{okr.employee.full_name}</p>
          )}
          {okr.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{okr.description}</p>}
        </div>
        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[okr.status] ?? statusColors.draft}`}>
          {okr.status.replace('_', ' ')}
        </span>
      </div>
      <OKRProgress progress={okr.progress ?? 0} />
      <div className="mt-2 text-right text-xs text-slate-400">{okr.progress ?? 0}%</div>
    </div>
  );
}