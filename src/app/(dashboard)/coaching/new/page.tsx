'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, Loader2, CheckCircle, ChevronRight } from 'lucide-react';

type Suggestion = { suggestion: string };

export default function NewCoachingPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSuggestions(data.logs ?? data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate coaching suggestions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/coaching"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Coaching Suggestions</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            AI-powered suggestions based on real performance data
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
          <Brain size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-900">How AI coaching works</p>
            <p className="text-sm text-indigo-700 mt-0.5 leading-relaxed">
              Our AI analyzes the employee&apos;s OKR progress, review scores, and 360° feedback
              to generate personalized, actionable coaching suggestions saved directly to their log.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Paste the employee UUID from their profile"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Find this in the URL when viewing an employee profile:{' '}
              <code className="bg-gray-100 px-1 rounded">/employees/[id]</code>
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Brain size={16} />
            )}
            {loading ? 'Generating suggestions...' : 'Generate Suggestions'}
          </button>
        </form>
      </div>

      {suggestions !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} generated &amp; saved
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            These have been saved to the employee&apos;s coaching log automatically.
          </p>

          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No suggestions were generated. The employee may not have enough data yet.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {typeof s === 'string' ? s : s.suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/coaching')}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all coaching logs <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}