'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Target } from 'lucide-react';

type OKRStatus = 'on_track' | 'at_risk' | 'missed' | 'achieved';

export default function NewOKRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<OKRStatus>('on_track');
  const [progress, setProgress] = useState(0);
  const [assigneeId, setAssigneeId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { title, description, status, progress };
      if (dueDate) payload.due_date = dueDate;
      if (assigneeId) payload.user_id = assigneeId;

      const res = await fetch('/api/okrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/okrs');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create OKR');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  const STATUS_OPTIONS: Array<{ value: OKRStatus; label: string; color: string }> = [
    { value: 'on_track', label: 'On Track', color: 'text-green-700' },
    { value: 'at_risk', label: 'At Risk', color: 'text-yellow-700' },
    { value: 'missed', label: 'Missed', color: 'text-red-700' },
    { value: 'achieved', label: 'Achieved', color: 'text-indigo-700' },
  ];

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/okrs"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create OKR</h1>
          <p className="text-gray-500 text-sm mt-0.5">Define a new objective for your team</p>
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
              Objective Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Launch new onboarding flow for Q2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
              <span className="text-gray-400 font-normal ml-1">— key results & context</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="KR1: Reduce time-to-first-value to under 5 min&#10;KR2: Achieve 80% completion rate..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OKRStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assignee ID
              <span className="text-gray-400 font-normal ml-1">(optional — defaults to you)</span>
            </label>
            <input
              type="text"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={inputClass}
              placeholder="Employee UUID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Progress:{' '}
              <span className="text-indigo-600 font-semibold">{progress}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
              {loading ? 'Creating...' : 'Create OKR'}
            </button>
            <Link href="/okrs" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}