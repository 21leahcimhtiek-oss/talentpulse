import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Calendar,
  TrendingUp,
  MessageCircle,
  Star,
  Brain,
  CheckCircle2,
} from 'lucide-react';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from('users').select('full_name').eq('id', params.id).single();
  return { title: data?.full_name ?? 'Employee Profile' };
}

function tenure(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

function OkrStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    on_track: 'bg-green-100 text-green-700',
    at_risk: 'bg-yellow-100 text-yellow-700',
    missed: 'bg-red-100 text-red-700',
    achieved: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cfg: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${cfg[sentiment] ?? 'bg-gray-100 text-gray-600'}`}>
      {sentiment}
    </span>
  );
}

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentUser } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  const [{ data: emp }, { data: okrs }, { data: reviews }, { data: feedback }, { data: coaching }] =
    await Promise.all([
      supabase
        .from('users')
        .select('*, manager:manager_id(full_name)')
        .eq('id', params.id)
        .single(),
      supabase
        .from('okrs')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('*')
        .eq('employee_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('feedback_360')
        .select('*')
        .eq('recipient_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('coaching_logs')
        .select('*')
        .eq('employee_id', params.id)
        .order('created_at', { ascending: false }),
    ]);

  if (!emp || emp.org_id !== currentUser?.org_id) notFound();

  const initials =
    emp.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';

  const avgScore =
    reviews && reviews.length > 0
      ? (
          reviews.reduce((s: number, r: { score: number }) => s + (r.score ?? 0), 0) /
          reviews.length
        ).toFixed(1)
      : null;

  const achievedOkrs = okrs?.filter((o: { status: string }) => o.status === 'achieved').length ?? 0;
  const okrPct =
    okrs && okrs.length > 0 ? Math.round((achievedOkrs / okrs.length) * 100) : null;

  const positiveFeedback =
    feedback?.filter((f: { sentiment: string }) => f.sentiment === 'positive').length ?? 0;
  const sentimentPct =
    feedback && feedback.length > 0
      ? Math.round((positiveFeedback / feedback.length) * 100)
      : null;

  const canCoach = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/employees" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Employee Profile</h1>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{emp.full_name}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="flex-shrink-0" />
                {emp.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} className="flex-shrink-0" />
                {emp.department ?? 'No department'}
              </span>
              <span className="flex items-center gap-1.5 capitalize">
                <Star size={13} className="flex-shrink-0" />
                {emp.role}
              </span>
              {emp.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="flex-shrink-0" />
                  {tenure(emp.start_date)} tenure
                </span>
              )}
              {emp.manager && (
                <span className="text-gray-400">
                  Manager: {(emp.manager as { full_name: string }).full_name}
                </span>
              )}
            </div>
          </div>
          {canCoach && (
            <Link
              href={`/coaching?employee=${params.id}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              <Brain size={14} className="inline mr-1.5" />
              Generate Coaching
            </Link>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{avgScore ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Avg Review Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {okrPct !== null ? `${okrPct}%` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">OKR Achievement</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {sentimentPct !== null ? `${sentimentPct}%` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Positive Feedback</p>
          </div>
        </div>
      </div>

      {/* OKRs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-500" />
          OKRs
          <span className="text-xs text-gray-400 font-normal ml-1">({okrs?.length ?? 0})</span>
        </h3>
        {!okrs || okrs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No OKRs assigned yet</p>
        ) : (
          <div className="space-y-3">
            {okrs.map(
              (okr: {
                id: string;
                title: string;
                status: string;
                progress: number;
                due_date: string;
              }) => (
                <div key={okr.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{okr.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due{' '}
                      {okr.due_date
                        ? new Date(okr.due_date).toLocaleDateString()
                        : 'No due date'}
                    </p>
                  </div>
                  <OkrStatusBadge status={okr.status} />
                  <div className="w-24 flex-shrink-0">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${okr.progress ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-0.5">{okr.progress ?? 0}%</p>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Reviews
          <span className="text-xs text-gray-400 font-normal ml-1">({reviews?.length ?? 0})</span>
        </h3>
        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(
              (review: {
                id: string;
                period: string;
                score: number;
                bias_flag: boolean;
                created_at: string;
              }) => (
                <div key={review.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {review.period ?? 'No period'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
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
                    <span className="text-xs text-gray-400 ml-1">{review.score ?? 0}/5</span>
                  </div>
                  {review.bias_flag && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium flex-shrink-0">
                      Bias Flag
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* 360 Feedback */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle size={16} className="text-indigo-500" />
          360° Feedback
          <span className="text-xs text-gray-400 font-normal ml-1">({feedback?.length ?? 0})</span>
        </h3>
        {!feedback || feedback.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No feedback yet</p>
        ) : (
          <div className="space-y-3">
            {feedback.map(
              (f: {
                id: string;
                content: string;
                sentiment: string;
                created_at: string;
              }) => (
                <div key={f.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <SentimentBadge sentiment={f.sentiment} />
                    <span className="text-xs text-gray-400">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{f.content}</p>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Coaching */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-indigo-500" />
          Coaching Logs
          <span className="text-xs text-gray-400 font-normal ml-1">({coaching?.length ?? 0})</span>
        </h3>
        {!coaching || coaching.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No coaching entries yet</p>
        ) : (
          <div className="space-y-3">
            {coaching.map(
              (log: {
                id: string;
                suggestion: string;
                acknowledged: boolean;
                created_at: string;
                is_ai_generated: boolean;
              }) => (
                <div key={log.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    {log.is_ai_generated && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Brain size={10} /> AI
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                    {log.acknowledged && (
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={10} /> Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{log.suggestion}</p>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}