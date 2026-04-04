import Link from 'next/link';
import { Building2, Calendar, User } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import type { Employee } from '@/types';

interface EmployeeCardProps {
  employee: Employee;
  managerName?: string;
}

export default function EmployeeCard({ employee, managerName }: EmployeeCardProps) {
  const initials = getInitials(employee.name);
  const colors = [
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
  ];
  const colorIndex = employee.name.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <Link
      href={`/employees/${employee.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${avatarColor}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
            {employee.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
            <Building2 size={13} />
            <span className="truncate">{employee.department || 'No department'}</span>
          </div>
          {managerName && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
              <User size={13} />
              <span className="truncate">Reports to {managerName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
            <Calendar size={13} />
            <span>Since {formatDate(employee.start_date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}