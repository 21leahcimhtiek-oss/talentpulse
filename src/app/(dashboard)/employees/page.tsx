import { createClient } from '@/lib/supabase/server';
import EmployeeCard from '@/components/EmployeeCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Employees' };

export default async function EmployeesPage() {
  const supabase = createClient();
  const { data: employees } = await supabase
    .from('employees')
    .select('*, profile:profiles(*), manager:profiles!manager_id(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 mt-1">{employees?.length ?? 0} active team members</p>
        </div>
        <a
          href="/api/employees"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Employee
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees?.map(emp => (
          <EmployeeCard key={emp.id} employee={emp as never} />
        ))}
        {!employees?.length && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            No employees yet. Add your first team member.
          </div>
        )}
      </div>
    </div>
  );
}