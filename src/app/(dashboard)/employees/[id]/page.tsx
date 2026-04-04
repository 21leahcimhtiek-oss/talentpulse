import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import OKRCard from '@/components/OKRCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Employee Details' };

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: employee } = await supabase
    .from('employees')
    .select('*, profile:profiles(*), manager:profiles!manager_id(*)')
    .eq('id', params.id)
    .single();

  if (!employee) notFound();

  const { data: okrs } = await supabase
    .from('okrs')
    .select('*')
    .eq('employee_id', employee.profile_id)
    .order('created_at', { ascending: false });

  const { data: reviews } = await supabase
    .from('performance_reviews')
    .select('*, reviewer:profiles!reviewer_id(*)')
    .eq('reviewee_id', employee.profile_id)
    .order('created_at', { ascending: false });

  const profile = employee.profile as { full_name: string; email: string; avatar_url: string | null } | null;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
          {profile?.full_name?.charAt(0) ?? '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{profile?.full_name}</h1>
          <p className="text-slate-500">{(employee as { job_title?: string }).job_title} · {(employee as { department?: string }).department}</p>
          <p className="text-sm text-slate-400 mt-0.5">Joined {formatDate((employee as { hire_date: string }).hire_date)}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">OKRs ({okrs?.length ?? 0})</h2>
        <div className="space-y-3">
          {okrs?.map(okr => <OKRCard key={okr.id} okr={okr as never} />)}
          {!okrs?.length && <p className="text-slate-400 text-sm">No OKRs found.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Reviews ({reviews?.length ?? 0})</h2>
        <div className="space-y-3">
          {reviews?.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Cycle: {(r as { cycle?: string }).cycle}</span>
                <span className="text-lg font-bold text-primary-600">{(r as { overall_score?: number }).overall_score}/5</span>
              </div>
              <p className="text-sm text-slate-600"><strong>Strengths:</strong> {(r as { strengths?: string }).strengths}</p>
              <p className="text-sm text-slate-600 mt-1"><strong>Areas to improve:</strong> {(r as { improvements?: string }).improvements}</p>
            </div>
          ))}
          {!reviews?.length && <p className="text-slate-400 text-sm">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}