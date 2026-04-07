import { formatDate } from '@/lib/utils';
import type { CoachingSuggestion } from '@/types';

interface Props {
  suggestion: CoachingSuggestion & { employee?: { full_name?: string } };
}

export default function CoachingCard({ suggestion }: Props) {
  const suggestions = suggestion.suggestions as string[] | { text: string }[] | null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-slate-900">{suggestion.employee?.full_name ?? 'Employee'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Generated {formatDate(suggestion.generated_at as string)}</p>
        </div>
        <span className="text-2xl">ðŸ§ </span>
      </div>
      {suggestions && suggestions.length > 0 && (
        <ul className="space-y-2.5">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span>{typeof s === 'string' ? s : s.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}