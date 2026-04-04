import { formatDate } from '@/lib/utils';
import type { PeerFeedback } from '@/types';

interface Props {
  feedback: PeerFeedback & { giver?: { full_name?: string; avatar_url?: string | null } };
}

const sentimentStyles: Record<string, string> = {
  positive: 'bg-green-50 text-green-700',
  neutral: 'bg-slate-50 text-slate-600',
  negative: 'bg-red-50 text-red-600',
};

export default function FeedbackCard({ feedback }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
          {feedback.is_anonymous ? '?' : feedback.giver?.full_name?.charAt(0) ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              {feedback.is_anonymous ? 'Anonymous' : feedback.giver?.full_name ?? 'Unknown'}
            </p>
            {feedback.sentiment_label && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sentimentStyles[feedback.sentiment_label] ?? sentimentStyles.neutral}`}>
                {feedback.sentiment_label}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{feedback.content}</p>
          <p className="text-xs text-slate-400 mt-2">{formatDate(feedback.created_at as string)}</p>
        </div>
      </div>
    </div>
  );
}