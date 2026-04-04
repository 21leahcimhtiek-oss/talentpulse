'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Loader2, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Employee } from '@/types';

const reviewSchema = z.object({
  employee_id: z.string().uuid(),
  period: z.string().min(1),
  score: z.number().min(1).max(5),
  strengths: z.string().min(20, 'Strengths must be at least 20 characters'),
  improvements: z.string().min(20, 'Areas for improvement must be at least 20 characters'),
});

interface ReviewFormProps {
  employees: Employee[];
}

interface SubmitResult {
  success: boolean;
  biasFlag?: boolean;
  biasNote?: string;
  error?: string;
}

export default function ReviewForm({ employees }: ReviewFormProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState('');
  const [score, setScore] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  function validate() {
    const parsed = reviewSchema.safeParse({ employee_id: employeeId, period, score, strengths, improvements });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { if (e.path[0]) fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, period, score, strengths, improvements }),
      });
      const data = await res.json();
      if (!res.ok) { setResult({ success: false, error: data.error || 'Submission failed' }); return; }
      setResult({ success: true, biasFlag: data.ai_bias_flag, biasNote: data.bias_note });
      setTimeout(() => router.push('/reviews'), 2500);
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-lg mx-auto text-center space-y-4">
        <CheckCircle2 className="mx-auto text-green-500" size={48} />
        <h2 className="text-xl font-semibold text-gray-900">Review Submitted</h2>
        {result.biasFlag ? (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Potential Bias Detected</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {result.biasNote || 'Our AI detected language patterns that may indicate bias. A reviewer will assess this submission.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No bias indicators detected. Redirecting to reviews...</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto space-y-5">
      <h2 className="text-lg font-semibold text-gray-900">Submit Performance Review</h2>
      {result?.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertTriangle size={16} />{result.error}
        </div>
      )}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Employee</label>
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select employee...</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>)}
        </select>
        {errors.employee_id && <p className="text-xs text-red-500">{errors.employee_id}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Review Period</label>
        <input type="text" placeholder="e.g. Q3 2024" value={period} onChange={(e) => setPeriod(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {errors.period && <p className="text-xs text-red-500">{errors.period}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Overall Score</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setScore(star)}
              onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 transition-transform hover:scale-110 focus:outline-none" aria-label={`Rate ${star} out of 5`}>
              <Star size={28} className={star <= (hoveredStar || score) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
            </button>
          ))}
          {score > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{score} / 5</span>}
        </div>
        {errors.score && <p className="text-xs text-red-500">{errors.score}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Strengths</label>
        <textarea rows={4} placeholder="Describe key strengths and achievements..." value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex justify-between">
          {errors.strengths ? <p className="text-xs text-red-500">{errors.strengths}</p> : <span />}
          <span className="text-xs text-gray-400">{strengths.length} chars</span>
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
        <textarea rows={4} placeholder="Describe areas that need improvement and suggestions..." value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex justify-between">
          {errors.improvements ? <p className="text-xs text-red-500">{errors.improvements}</p> : <span />}
          <span className="text-xs text-gray-400">{improvements.length} chars</span>
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}