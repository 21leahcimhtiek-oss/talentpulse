import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';

export const metadata = { title: 'Employees' };

type Employee = {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  role: string;
};

function EmployeeCard({ emp }: { emp: Employee }) {
  const initials = emp.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const departmentColor = emp.department
    ? 'bg-gray-100 text-gray-600'
    : 'bg-gray-50 text-gray-400';

  return (
    <Link
      href={`/employees/${emp.id}`}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all block group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{emp.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{emp.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {emp.department && (
          <span className={`text-xs px-2 py-0.5 rounded ${departmentColor}`}>
            {emp.department}
          </span>
        )}
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded capitalize">
          {emp.role}
        </span>
      </div>
    </Link>
  );
}

export default async function EmployeesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  const { data: employees } = await supabase
    .from('users')
    .select('id, full_name, email, department, role')
    .eq('org_id', userData?.org_id)
    .order('full_name');

  const canManage = userData?.role === 'admin' || userData?.role === 'manager';

  const departments = [
    ...new Set(
      employees?.map((e) => e.department).filter(Boolean) ?? [],
    ),
  ] as string[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">
            {employees?.length ?? 0} team member{employees?.length !== 1 ? 's' : ''}
            {departments.length > 0 && ` across ${departments.length} department${departments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {canManage && (
          <Link
            href="/employees/new"
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Add Employee
          </Link>
        )}
      </div>

      {!employees || employees.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-200">
          <Users size={44} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-lg">No employees yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Add your first team member to start tracking performance.
          </p>
          {canManage && (
            <Link
              href="/employees/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Add Employee
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))}
        </div>
      )}
    </div>
  );
}