import Link from 'next/link';
import type { Employee } from '@/types';

interface Props {
  employee: Employee & { profile?: { full_name?: string; email?: string; avatar_url?: string | null } };
}

export default function EmployeeCard({ employee }: Props) {
  const profile = employee.profile;
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() ?? '?';

  return (
    <Link href={`/employees/${employee.id}`} className="block">
      <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{profile?.full_name ?? '—'}</p>
            <p className="text-sm text-slate-500 truncate">{employee.job_title ?? '—'}</p>
            <p className="text-xs text-slate-400 truncate">{employee.department ?? '—'}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {employee.status}
          </span>
        </div>
      </div>
    </Link>
  );
}