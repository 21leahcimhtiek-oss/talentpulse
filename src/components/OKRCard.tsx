import { Calendar, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import OKRProgress from './OKRProgress';
import { cn, getOKRStatusColor, getOKRProgressPercent, formatDate } from '@/lib/utils';
import type { OKR } from '@/types';

interface OKRCardProps {
  okr: OKR;
  employeeName?: string;
  showEmployee?: boolean;
}

const statusIcons = {
  on_track: <TrendingUp size={14} className="text-green-600" />,
  at_risk: <AlertCircle size={14} className="text-yellow-600" />,
  missed: <TrendingDown size={14} className="text-red-600" />,
  achieved: <CheckCircle2 size={14} className="text-blue-600" />,
};

const statusLabels = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  missed: 'Missed',
  achieved: 'Achieved',
};

export default function OKRCard({ okr, employeeName, showEmployee = false }: OKRCardProps) {
  const percent = getOKRProgressPercent(okr.current, okr.target);
  const isOverdue = new Date(okr.due_date) < new Date() && okr.status !== 'achieved';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {showEmployee && employeeName && (
            <p className="text-xs text-gray-500 mb-0.5">{employeeName}</p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{okr.title}</h3>
          {okr.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{okr.description}</p>
          )}
        </div>
        <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap', getOKRStatusColor(okr.status))}>
          {statusIcons[okr.status]}
          {statusLabels[okr.status]}
        </span>
      </div>

      <OKRProgress current={okr.current} target={okr.target} unit={okr.unit} />

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>{percent}% complete</span>
        <div className={cn('flex items-center gap-1', isOverdue && 'text-red-500')}>
          <Calendar size={12} />
          <span>{isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(okr.due_date)}</span>
        </div>
      </div>
    </div>
  );
}