import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Star, AlertTriangle, ClipboardList } from 'lucide-react';

export const metadata = { title: 'Performance Reviews' };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  const periodFilter = searchParams.period;

  let query = supabase
    .from('reviews')
    .select('*, employee:employee_id(full_name), reviewer:reviewer_id(full_name)')
    .eq('org_id', userData?.org_id)
    .order('created_at', { ascending: false });

  if (periodFilter) {
    query = query.eq('period', periodFilter);
  }

  const [{ data: reviews }, { data: periodRows }] = await Promise.all([
    query,
    supabase
      .from('reviews')
      .select('period')
      .eq('org_id', userData?.org_id)
      .not('period', 'is', null),
  ]);

  const uniquePeriods = [...new Set(periodRows?.map((p) => p.period).filter(Boolean) ?? [])];

  type Review = {
    id: string;
    period: string | null;
    score: number;
    bias_flag: boolean;
    created_at: string;
    employee: { full_name: string } | null;
    reviewer: { full_name: string } | null;
  };

  const grouped = (reviews ?? []).reduce<Record<string, Review[]>>((acc, r) => {
    const key = r.period ?? 'No Period';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r as Review);
    return acc;
  }, {});

  const canCreate = userData?.role === 'admin' || userData?.role === 'manager';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-500 mt-1">
            {reviews?.length ?? 0} review{reviews?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/reviews/new"
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> New Review
          </Link>
        )}
      </div>

      {/* Period filter */}
      {uniquePeriods.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/reviews"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !periodFilter
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            All Periods
          </Link>
          {uniquePeriods.map((p) => (
            <Link
              key={p}
              href={`/reviews?period=${p}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-200">
          <ClipboardList size={44} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-lg">No reviews found</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            {periodFilter
              ? 'No reviews for this period.'
              : 'Create your first performance review to get started.'}
          </p>
          {canCreate && !periodFilter && (
            <Link
              href="/reviews/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Create Review
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([period, periodReviews]) => (
            <div key={period}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {period}
                <span className="ml-2 text-gray-300 normal-case tracking-normal">
                  ({periodReviews.length})
                </span>
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {periodReviews.map((review) => (
                  <div key={review.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {review.employee?.full_name ?? 'Unknown Employee'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Reviewed by {review.reviewer?.full_name ?? 'Unknown'} &middot;{' '}
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < (review.score ?? 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-200 fill-gray-200'
                          }
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1.5">{review.score ?? 0}/5</span>
                    </div>
                    {review.bias_flag && (
                      <div className="flex items-center gap-1 text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                        <AlertTriangle size={12} /> Bias Detected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}