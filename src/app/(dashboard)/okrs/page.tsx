import { createClient } from '@/lib/supabase/server';
import OKRCard from '@/components/OKRCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'OKRs' };

export default async function OKRsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: okrs } = await supabase
    .from('okrs')
    .select('*, employee:profiles(*)')
    .order('created_at', { ascending: false });

  const onTrack = okrs?.filter(o => o.status === 'on_track').length ?? 0;
  const atRisk = okrs?.filter(o => o.status === 'at_risk').length ?? 0;
  const completed = okrs?.filter(o => o.status === 'completed').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OKRs</h1>
          <p className="text-slate-500 mt-1">{okrs?.length ?? 0} objectives tracked</p>
        </div>
        <a href="/api/okrs" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          + New OKR
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'On Track', count: onTrack, color: 'bg-green-50 text-green-700' },
          { label: 'At Risk', count: atRisk, color: 'bg-amber-50 text-amber-700' },
          { label: 'Completed', count: completed, color: 'bg-blue-50 text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {okrs?.map(okr => <OKRCard key={okr.id} okr={okr as never} showEmployee />)}
        {!okrs?.length && <div className="text-center py-16 text-slate-400">No OKRs yet.</div>}
      </div>
    </div>
  );
}