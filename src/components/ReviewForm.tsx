'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Employee { id: string; full_name: string | null; email: string | null; }

interface Props {
  employees: Employee[];
}

export default function ReviewForm({ employees }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    reviewee_id: '',
    cycle: '',
    overall_score: 3,
    strengths: '',
    improvements: '',
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const [biasResult, setBiasResult] = useState<{ bias_free: boolean; flags: { type: string; description: string }[]; overall_assessment: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBiasResult(null);

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();

    if (!res.ok) { setError(json.error); setLoading(false); return; }

    if (json.bias && !json.bias.bias_free) {
      setBiasResult(json.bias);
      setLoading(false);
      return;
    }

    router.push('/reviews');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee</label>
        <select
          value={form.reviewee_id}
          onChange={e => setForm(f => ({ ...f, reviewee_id: e.target.value }))}
          required
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select employeeâ€¦</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.full_name ?? emp.email}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Review Cycle (e.g. Q4 2024)</label>
        <input
          value={form.cycle}
          onChange={e => setForm(f => ({ ...f, cycle: e.target.value }))}
          required
          placeholder="Q4 2024"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Overall Score: {form.overall_score}/5</label>
        <input
          type="range" min={1} max={5} step={0.5}
          value={form.overall_score}
          onChange={e => setForm(f => ({ ...f, overall_score: parseFloat(e.target.value) }))}
          className="w-full accent-primary-600"
        />
      </div>

      {[
        { key: 'strengths', label: 'Strengths', placeholder: 'What does this employee do well?' },
        { key: 'improvements', label: 'Areas for Improvement', placeholder: 'Where can they grow?' },
        { key: 'comments', label: 'Additional Comments', placeholder: 'Any other observationsâ€¦' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
          <textarea
            value={form[key as keyof typeof form] as string}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={3}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      ))}

      {biasResult && !biasResult.bias_free && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800 mb-2">âš ï¸ Potential Bias Detected</p>
          <p className="text-sm text-amber-700 mb-3">{biasResult.overall_assessment}</p>
          <ul className="space-y-1">
            {biasResult.flags.map((f, i) => (
              <li key={i} className="text-sm text-amber-700">â€¢ <strong>{f.type}</strong>: {f.description}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-600 mt-3">Please revise your review or click Submit anyway to proceed.</p>
          <button type="submit" className="mt-3 px-4 py-2 border border-amber-400 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors" onClick={() => setBiasResult(null)}>
            Submit Anyway
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Analyzing for biasâ€¦' : 'Submit Review'}
      </button>
    </form>
  );
}