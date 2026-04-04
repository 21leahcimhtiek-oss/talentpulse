import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Brain, CheckCircle2, Sparkles } from 'lucide-react';

export const metadata = { title: 'Coaching' };

type CoachingLog = {
  id: string;
  suggestion: string;
  acknowledged: boolean;
  created_at: string;
  is_ai_generated: boolean;
  employee: { id: string; full_name: string; department: string | null } | null;
};

export default async function CoachingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user!.id)
    .single();

  if (userData?.role === 'employee') redirect('/dashboard');

  const { data: logs } = await supabase
    .from('coaching_logs')
    .select('*, employee:employee_id(id, full_name, department)')
    .eq('org_id', userData?.org_id)
    .order('created_at', { ascending: false });

  const grouped = (logs ?? []).reduce<Record<string, CoachingLog[]>>((acc, log) => {
    const emp = log.employee as { id: string } | null;
    const key = emp?.id ?? 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(log as CoachingLog);
    return acc;
  }, {});

  const totalLogs = logs?.length ?? 0;
  const acknowledgedCount = logs?.filter((l) => l.acknowledged).length ?? 0;
  const aiGeneratedCount = logs?.filter((l) => l.is_ai_generated).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching Logs</h1>
          <p className="text-gray-500 mt-1">
            {totalLogs} entr{totalLogs !== 1 ? 'ies' : 'y'} across{' '}
            {Object.keys(grouped).length} employee{Object.keys(grouped).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/coaching/new"
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Sparkles size={16} /> Generate Suggestions
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Entries', value: totalLogs },
          { label: 'AI Generated', value: aiGeneratedCount },
          { label: 'Acknowledged', value: acknowledgedCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {totalLogs === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-200">
          <Brain size={44} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-lg">No coaching entries yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Generate AI coaching suggestions from employee performance data.
          </p>
          <Link
            href="/coaching/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Sparkles size={16} /> Generate First Suggestions
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([empId, empLogs]) => {
            const emp = empLogs[0]?.employee;
            return (
              <div key={empId} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                    {emp?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) ?? '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {emp?.full_name ?? 'Unknown Employee'}
                    </p>
                    {emp?.department && (
                      <p className="text-xs text-gray-400">{emp.department}</p>
                    )}
                  </div>
                  <Link
                    href={`/employees/${empId}`}
                    className="text-xs text-indigo-600 hover:underline flex-shrink-0"
                  >
                    View Profile
                  </Link>
                </div>
                <div className="space-y-3">
                  {empLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {log.is_ai_generated && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <Brain size={10} /> AI Generated
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                        {log.acknowledged && (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 size={10} /> Acknowledged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{log.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}