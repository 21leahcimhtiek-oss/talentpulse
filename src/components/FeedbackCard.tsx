import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { formatDate, getSentimentColor, getSentimentLabel } from '@/lib/utils';
import type { Feedback360 } from '@/types';

interface FeedbackCardProps {
  feedback: Feedback360;
  fromName?: string;
  isAdmin?: boolean;
}

const sentimentIcons = {
  Positive: <ThumbsUp size={13} />,
  Neutral: <Minus size={13} />,
  Negative: <ThumbsDown size={13} />,
};

const sentimentBg = {
  Positive: 'bg-green-50 border-green-200 text-green-700',
  Neutral: 'bg-gray-50 border-gray-200 text-gray-600',
  Negative: 'bg-red-50 border-red-200 text-red-700',
};

export default function FeedbackCard({ feedback, fromName, isAdmin = false }: FeedbackCardProps) {
  const label = getSentimentLabel(feedback.sentiment);
  const displayName = isAdmin && fromName ? fromName : 'Team Member';
  const scorePercent = Math.round(((feedback.sentiment + 1) / 2) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-800 leading-relaxed flex-1">{feedback.content}</p>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap ${sentimentBg[label]}`}>
          {sentimentIcons[label]}
          {label}
        </span>
      </div>

      {/* Sentiment score bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Sentiment</span>
          <span className={getSentimentColor(feedback.sentiment)}>{scorePercent}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              feedback.sentiment >= 0.3 ? 'bg-green-500' : feedback.sentiment >= -0.2 ? 'bg-gray-400' : 'bg-red-500'
            }`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
        <span className="font-medium text-gray-500">{displayName}</span>
        <span>{formatDate(feedback.created_at)}</span>
      </div>
    </div>
  );
}