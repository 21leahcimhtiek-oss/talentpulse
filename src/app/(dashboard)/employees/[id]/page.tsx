import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import OKRCard from "@/components/OKRCard";
import FeedbackCard from "@/components/FeedbackCard";
import CoachingCard from "@/components/CoachingCard";
import { getInitials, calculateTenure, formatDate } from "@/lib/utils";
import { Building2, Calendar, User, Star, Target } from "lucide-react";
import type { Metadata } from "next";
import type { Employee, OKR, Feedback360, CoachingLog, Review } from "@/types";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("employees").select("name").eq("id", params.id).single();
  return { title: data?.name ?? "Employee Profile" };
}

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: employee },
    { data: okrs },
    { data: reviews },
    { data: feedback },
    { data: coaching },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("id", params.id).single(),
    supabase.from("okrs").select("*").eq("employee_id", params.id).order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").eq("employee_id", params.id).order("created_at", { ascending: false }),
    supabase.from("feedback_360").select("*").eq("employee_id", params.id).order("created_at", { ascending: false }),
    supabase.from("coaching_logs").select("*").eq("employee_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (!employee) notFound();

  const avgScore =
    reviews && reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.score, 0) / reviews.length).toFixed(1)
      : null;

  const okrProgress =
    okrs && okrs.length > 0
      ? Math.round(
          (okrs.filter((o) => o.status === "achieved" || o.status === "on_track").length / okrs.length) * 100
        )
      : null;

  const avgSentiment =
    feedback && feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.sentiment, 0) / feedback.length).toFixed(2)
      : null;

  const initials = getInitials(employee.name);
  const colors = ["bg-indigo-100 text-indigo-700", "bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700", "bg-teal-100 text-teal-700"];
  const avatarColor = colors[employee.name.charCodeAt(0) % colors.length];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${avatarColor}`}>
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Building2 size={14} />{employee.department || "No department"}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} />Since {formatDate(employee.start_date)} ({calculateTenure(employee.start_date)})</span>
            </div>
            <div className="flex gap-6 mt-4">
              {avgScore && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">{avgScore}<Star size={16} className="text-yellow-400 fill-yellow-400" /></div>
                  <div className="text-xs text-gray-400">Avg Score</div>
                </div>
              )}
              {okrProgress !== null && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">{okrProgress}%<Target size={16} className="text-green-500" /></div>
                  <div className="text-xs text-gray-400">OKR Progress</div>
                </div>
              )}
              {avgSentiment && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{parseFloat(avgSentiment) > 0 ? "+" : ""}{avgSentiment}</div>
                  <div className="text-xs text-gray-400">Avg Sentiment</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {okrs && okrs.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">OKRs ({okrs.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {okrs.map((okr) => <OKRCard key={okr.id} okr={okr as OKR} />)}
          </div>
        </div>
      )}

      {reviews && reviews.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Reviews ({reviews.length})</h2>
          <div className="space-y-3">
            {(reviews as Review[]).map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{review.period}</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < review.score ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                    ))}
                  </div>
                </div>
                {review.ai_bias_flag && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">⚠ Bias flagged</span>
                )}
                {review.strengths && <p className="text-sm text-gray-600 mt-2"><strong>Strengths:</strong> {review.strengths}</p>}
                {review.improvements && <p className="text-sm text-gray-600 mt-1"><strong>Areas for improvement:</strong> {review.improvements}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback && feedback.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">360° Feedback ({feedback.length})</h2>
          <div className="space-y-3">
            {(feedback as Feedback360[]).map((f) => <FeedbackCard key={f.id} feedback={f} />)}
          </div>
        </div>
      )}

      {coaching && coaching.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Coaching Logs ({coaching.length})</h2>
          <div className="space-y-3">
            {(coaching as CoachingLog[]).map((log) => <CoachingCard key={log.id} log={log} />)}
          </div>
        </div>
      )}
    </div>
  );
}