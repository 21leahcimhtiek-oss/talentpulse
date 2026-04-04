import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, TrendingUp, Edit2 } from 'lucide-react';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from('okrs').select('title').eq('id', params.id).single();
  return { title: data?.title ?? 'OKR Detail' };
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  on_track: { label: 'On Track', cls: 'bg-green-100 text-green-700 border-green-200' },
  at_risk: { label: 'At Risk', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  missed: { label: 'Missed', cls: 'bg-red-100 text-red-700 border-red-200' },
  achieved: { label: 'Achieved', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

export default async function OKRDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  const { data: okr } = await supabase
    .from('okrs')
    .select('*, assignee:user_id(full_name, email, department)')
    .eq('id', params.id)
    .single();

  if (!okr || okr.org_id !== userData?.org_id) notFound();

  const cfg = STATUS_CFG[okr.status] ?? { label: okr.status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  const canEdit = userData?.role === 'admin' || userData?.role === 'manager';
  const assignee = okr.assignee as { full_name: string; email: string; department: string | null } | null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/okrs" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">OKR Detail</h1>
        {canEdit && (
          <Link
            href={`/okrs/${params.id}/edit`}
            className="ml-auto flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Edit2 size={13} /> Edit
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{okr.title}</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded border flex-shrink-0 ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>

        {okr.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{okr.description}</p>
        )}

        {/* Meta row */}
        <div className="grid sm:grid-cols-3 gap-4 py-4 border-y border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{assignee?.full_name ?? 'Unassigned'}</p>
              {assignee?.department && (
                <p className="text-xs text-gray-400">{assignee.department}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <span>
              {okr.due_date
                ? new Date(okr.due_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No due date'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp size={14} className="text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900">{okr.progress ?? 0}%</span>
            <span>complete</span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Progress</span>
            <span className="font-bold text-gray-900">{okr.progress ?? 0}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                (okr.progress ?? 0) >= 70
                  ? 'bg-green-500'
                  : (okr.progress ?? 0) >= 40
                  ? 'bg-yellow-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(okr.progress ?? 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-400 flex gap-4">
          <span>Created {new Date(okr.created_at).toLocaleDateString()}</span>
          {okr.updated_at && okr.updated_at !== okr.created_at && (
            <span>Updated {new Date(okr.updated_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {assignee && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignee</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
              {assignee.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{assignee.full_name}</p>
              <p className="text-xs text-gray-400">{assignee.email}</p>
            </div>
            <Link
              href={`/employees/${okr.user_id}`}
              className="ml-auto text-xs text-indigo-600 hover:underline"
            >
              View Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}