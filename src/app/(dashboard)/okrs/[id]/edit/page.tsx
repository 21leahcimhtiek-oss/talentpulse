'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

type OKRStatus = 'on_track' | 'at_risk' | 'missed' | 'achieved';

export default function EditOKRPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<OKRStatus>('on_track');
  const [progress, setProgress] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/okrs/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setDueDate(data.due_date ?? '');
        setStatus(data.status ?? 'on_track');
        setProgress(data.progress ?? 0);
      })
      .catch(() => setError('Failed to load OKR'))
      .finally(() => setFetching(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/okrs/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, due_date: dueDate || null, status, progress }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/okrs/${params.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update OKR');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={`/okrs/${params.id}`}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit OKR</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update objective details and progress</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {fetching ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading OKR...</span>
          </div>
        ) : (
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
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
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
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="missed">Missed</option>
                  <option value="achieved">Achieved</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress: <span className="text-indigo-600 font-semibold">{progress}%</span>
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
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/okrs/${params.id}`}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}