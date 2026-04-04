import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Target } from 'lucide-react';

export const metadata = { title: 'OKRs' };

type OKRStatus = 'on_track' | 'at_risk' | 'missed' | 'achieved';

const STATUS_COLORS: Record<string, string> = {
  on_track: 'bg-green-100 text-green-700',
  at_risk: 'bg-yellow-100 text-yellow-700',
  missed: 'bg-red-100 text-red-700',
  achieved: 'bg-indigo-100 text-indigo-700',
};

type OKR = {
  id: string;
  title: string;
  description?: string;
  status: OKRStatus;
  progress: number;
  due_date: string;
  users?: { full_name: string };
};

function OkrCard({ okr }: { okr: OKR }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{okr.title}</p>
          {okr.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{okr.description}</p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 capitalize ${STATUS_COLORS[okr.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {okr.status?.replace('_', ' ')}
        </span>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span className="font-medium">{okr.progress ?? 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(okr.progress ?? 0, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{okr.users?.full_name ?? 'Unassigned'}</span>
        <span>
          Due{' '}
          {okr.due_date ? new Date(okr.due_date).toLocaleDateString() : 'No date'}
        </span>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = ['all', 'on_track', 'at_risk', 'missed', 'achieved'];

export default async function OKRsPage({
  searchParams,
}: {
  searchParams: { status?: string };
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

  const statusFilter = searchParams.status;

  let query = supabase
    .from('okrs')
    .select('*, users(full_name)')
    .eq('org_id', userData?.org_id)
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: okrs } = await query;
  const all = okrs ?? [];

  const totalOkrs = all.length;
  const onTrackCount = all.filter((o) => o.status === 'on_track').length;
  const atRiskCount = all.filter((o) => o.status === 'at_risk').length;
  const achievedCount = all.filter((o) => o.status === 'achieved').length;
  const onTrackPct = totalOkrs > 0 ? Math.round((onTrackCount / totalOkrs) * 100) : 0;

  const canCreate = userData?.role === 'admin' || userData?.role === 'manager';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OKRs</h1>
          <p className="text-gray-500 mt-1">{totalOkrs} objective{totalOkrs !== 1 ? 's' : ''} tracked</p>
        </div>
        {canCreate && (
          <Link
            href="/okrs/new"
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Create OKR
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalOkrs },
          { label: 'On Track', value: `${onTrackPct}%` },
          { label: 'At Risk', value: atRiskCount },
          { label: 'Achieved', value: achievedCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => {
          const isActive = (statusFilter ?? 'all') === s;
          return (
            <Link
              key={s}
              href={s === 'all' ? '/okrs' : `/okrs?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {s.replace('_', ' ')}
            </Link>
          );
        })}
      </div>

      {/* OKR grid */}
      {all.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-200">
          <Target size={44} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-lg">No OKRs found</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            {statusFilter && statusFilter !== 'all'
              ? 'No OKRs match this filter.'
              : 'Create your first objective to get started.'}
          </p>
          {canCreate && (statusFilter === undefined || statusFilter === 'all') && (
            <Link
              href="/okrs/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Create OKR
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {all.map((okr) => (
            <OkrCard key={okr.id} okr={okr as OKR} />
          ))}
        </div>
      )}
    </div>
  );
}