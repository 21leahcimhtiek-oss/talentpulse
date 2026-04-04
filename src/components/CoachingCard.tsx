'use client';
import { useState } from 'react';
import { Brain, CheckCircle2, Circle, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CoachingLog } from '@/types';

interface CoachingCardProps {
  coaching: CoachingLog;
  managerName?: string;
  onAcknowledge?: (id: string, acknowledged: boolean) => void;
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <div key={i} className="font-bold text-gray-900 text-sm mt-3 mb-1 first:mt-0">
          {line.replace(/^## /, '')}
        </div>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <div key={i} className="font-bold text-gray-900 text-base mt-3 mb-1 first:mt-0">
          {line.replace(/^# /, '')}
        </div>
      );
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    // Parse inline **bold**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={i} className="text-sm text-gray-700 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </div>
    );
  });
}

export default function CoachingCard({ coaching, managerName, onAcknowledge }: CoachingCardProps) {
  const [acknowledged, setAcknowledged] = useState(coaching.acknowledged);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/coaching/${coaching.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: !acknowledged }),
      });
      if (res.ok) {
        setAcknowledged(!acknowledged);
        onAcknowledge?.(coaching.id, !acknowledged);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${acknowledged ? 'border-gray-200 opacity-80' : 'border-indigo-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {coaching.ai_generated && (
            <span className="flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
              <Brain size={11} />
              AI Generated
            </span>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            acknowledged
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
          aria-label={acknowledged ? 'Mark as unacknowledged' : 'Acknowledge'}
        >
          {acknowledged ? <CheckCircle2 size={13} /> : <Circle size={13} />}
          {acknowledged ? 'Acknowledged' : 'Acknowledge'}
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg bg-gray-50 border border-gray-100 p-4 space-y-0.5">
        {renderMarkdown(coaching.suggestion_md)}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <User size={12} />
          <span>{managerName || 'Manager'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />
          <span>{formatDate(coaching.created_at)}</span>
        </div>
      </div>
    </div>
  );
}