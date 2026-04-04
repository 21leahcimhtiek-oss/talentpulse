import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Performance Reviews' };

export default async function ReviewsPage() {
  const supabase = createClient();
  const { data: reviews } = await supabase
    .from('performance_reviews')
    .select('*, reviewer:profiles!reviewer_id(*), reviewee:profiles!reviewee_id(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Reviews</h1>
          <p className="text-slate-500 mt-1">{reviews?.length ?? 0} reviews total</p>
        </div>
        <Link
          href="/reviews/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Review
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Employee', 'Reviewer', 'Cycle', 'Score', 'Status', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews?.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {(r.reviewee as { full_name?: string })?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {(r.reviewer as { full_name?: string })?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{(r as { cycle?: string }).cycle}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                    {(r as { overall_score?: number }).overall_score ?? '—'}<span className="text-slate-400 font-normal">/5</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${(r as { submitted_at?: string | null }).submitted_at ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {(r as { submitted_at?: string | null }).submitted_at ? 'Submitted' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatDate(r.created_at as string)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reviews?.length && (
          <div className="text-center py-16 text-slate-400">No reviews yet.</div>
        )}
      </div>
    </div>
  );
}