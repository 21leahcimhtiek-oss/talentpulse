import ReviewForm from '@/components/ReviewForm';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Review' };

export default async function NewReviewPage() {
  const supabase = createClient();
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .neq('role', 'admin')
    .order('full_name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Performance Review</h1>
        <p className="text-slate-500 mt-1">AI bias detection runs automatically before you submit.</p>
      </div>
      <ReviewForm employees={employees ?? []} />
    </div>
  );
}