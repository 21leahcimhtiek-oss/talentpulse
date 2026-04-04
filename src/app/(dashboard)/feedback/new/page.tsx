'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, MessageCircle } from 'lucide-react';

type Sentiment = 'positive' | 'neutral' | 'negative';

const SENTIMENT_OPTIONS: Array<{ value: Sentiment; label: string; desc: string; cls: string; activeCls: string }> = [
  {
    value: 'positive',
    label: 'Positive',
    desc: 'Recognizing strengths',
    cls: 'border-gray-200 text-gray-600 hover:border-green-300',
    activeCls: 'border-green-400 bg-green-50 text-green-700 ring-2 ring-green-200',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    desc: 'Balanced observation',
    cls: 'border-gray-200 text-gray-600 hover:border-gray-400',
    activeCls: 'border-gray-400 bg-gray-50 text-gray-700 ring-2 ring-gray-200',
  },
  {
    value: 'negative',
    label: 'Constructive',
    desc: 'Growth opportunity',
    cls: 'border-gray-200 text-gray-600 hover:border-orange-300',
    activeCls: 'border-orange-400 bg-orange-50 text-orange-700 ring-2 ring-orange-200',
  },
];

export default function NewFeedbackPage() {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState('');
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment>('neutral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write your feedback before submitting.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId, content, sentiment }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(true);
      setTimeout(() => router.push('/feedback'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-xl">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={28} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Feedback submitted!</h2>
          <p className="text-sm text-gray-500">Redirecting to feedback list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/feedback"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Give 360° Feedback</h1>
          <p className="text-gray-500 text-sm mt-0.5">Provide peer feedback to a team member</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Recipient Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Paste the employee UUID from their profile"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SENTIMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSentiment(opt.value)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    sentiment === opt.value ? opt.activeCls : opt.cls
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs mt-0.5 opacity-75">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Be specific and actionable. Focus on observable behaviors and their impact.&#10;&#10;e.g. &quot;During the Q3 planning session, your clear communication of technical constraints helped the team avoid a 2-week delay.&quot;"
              required
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <MessageCircle size={11} /> Feedback is anonymous to the recipient
              </span>
              <span>{content.length} chars</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <Link href="/feedback" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}