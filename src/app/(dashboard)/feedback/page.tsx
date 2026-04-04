import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, MessageCircle } from 'lucide-react';

export const metadata = { title: '360° Feedback' };

const SENTIMENT_CFG: Record<string, { label: string; cls: string }> = {
  positive: { label: 'Positive', cls: 'bg-green-100 text-green-700' },
  negative: { label: 'Negative', cls: 'bg-red-100 text-red-700' },
  neutral: { label: 'Neutral', cls: 'bg-gray-100 text-gray-600' },
};

export default async function FeedbackPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  const { data: feedback } = await supabase
    .from('feedback_360')
    .select('*, recipient:recipient_id(full_name), author:author_id(full_name)')
    .eq('org_id', userData?.org_id)
    .order('created_at', { ascending: false });

  const all = feedback ?? [];
  const positiveCount = all.filter((f) => f.sentiment === 'positive').length;
  const negativeCount = all.filter((f) => f.sentiment === 'negative').length;
  const neutralCount = all.filter((f) => f.sentiment === 'neutral').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">360° Feedback</h1>
          <p className="text-gray-500 mt-1">
            {all.length} entr{all.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <Link
          href="/feedback/new"
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Give Feedback
        </Link>
      </div>

      {/* Sentiment summary */}
      {all.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Positive', count: positiveCount, cls: 'bg-green-50 border-green-100 text-green-700' },
            { label: 'Neutral', count: neutralCount, cls: 'bg-gray-50 border-gray-100 text-gray-600' },
            { label: 'Negative', count: negativeCount, cls: 'bg-red-50 border-red-100 text-red-700' },
          ].map(({ label, count, cls }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${cls}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {all.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-200">
          <MessageCircle size={44} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-lg">No feedback yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Peer feedback helps employees grow and improves team dynamics.
          </p>
          <Link
            href="/feedback/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Give First Feedback
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {all.map((f) => {
            const cfg = SENTIMENT_CFG[f.sentiment] ?? SENTIMENT_CFG.neutral;
            const recipient = f.recipient as { full_name: string } | null;
            const author = f.author as { full_name: string } | null;
            return (
              <div key={f.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {recipient?.full_name ?? 'Unknown'}
                    </span>
                    {author && (
                      <span className="text-xs text-gray-400 ml-1.5">
                        from {author.full_name}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{f.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}