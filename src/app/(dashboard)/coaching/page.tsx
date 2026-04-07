import { createClient } from '@/lib/supabase/server';
import CoachingCard from '@/components/CoachingCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Coaching' };

export default async function CoachingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: suggestions } = await supabase
    .from('coaching_suggestions')
    .select('*, employee:profiles!employee_id(*)')
    .eq('manager_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Coaching Suggestions</h1>
        <p className="text-slate-500 mt-1">Weekly AI-generated coaching recommendations for your direct reports.</p>
      </div>
      <div className="space-y-4">
        {suggestions?.map(s => <CoachingCard key={s.id} suggestion={s as never} />)}
        {!suggestions?.length && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400">
            <p className="text-4xl mb-3">ðŸ§ </p>
            <p className="font-medium">No coaching suggestions yet.</p>
            <p className="text-sm mt-1">Suggestions are generated weekly based on your team performance data.</p>
          </div>
        )}
      </div>
    </div>
  );
}