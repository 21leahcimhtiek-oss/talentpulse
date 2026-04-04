import { createClient } from "@/lib/supabase/server";
import { Star, PlusCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const supabase = createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, employees(name), reviewer:users!reviewer_id(email)")
    .order("created_at", { ascending: false });

  const periods = [...new Set((reviews ?? []).map((r) => r.period))].sort().reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-500 mt-1">{reviews?.length ?? 0} reviews total</p>
        </div>
        <Link
          href="/reviews/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          New Review
        </Link>
      </div>

      {periods.length > 0 ? (
        <div className="space-y-6">
          {periods.map((period) => {
            const periodReviews = (reviews ?? []).filter((r) => r.period === period);
            const avgScore =
              periodReviews.length > 0
                ? (periodReviews.reduce((s, r) => s + r.score, 0) / periodReviews.length).toFixed(1)
                : "0";
            const biasCount = periodReviews.filter((r) => r.ai_bias_flag).length;

            return (
              <div key={period}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-800">{period}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{periodReviews.length} reviews</span>
                    <span className="flex items-center gap-1">
                      <Star size={13} className="text-yellow-400 fill-yellow-400" />
                      {avgScore} avg
                    </span>
                    {biasCount > 0 && (
                      <span className="flex items-center gap-1 text-orange-500">
                        <AlertCircle size={13} />
                        {biasCount} bias flag{biasCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {periodReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {(review.employees as { name: string } | null)?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Reviewed by {(review.reviewer as { email: string } | null)?.email ?? "Unknown"} · {formatDate(review.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {review.ai_bias_flag && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={10} />
                            Bias flagged
                          </span>
                        )}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.score ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Star size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Start a new review cycle to evaluate your team</p>
        </div>
      )}
    </div>
  );
}