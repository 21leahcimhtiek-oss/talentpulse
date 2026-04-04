import { createClient } from "@/lib/supabase/server";
import CoachingCard from "@/components/CoachingCard";
import { Brain } from "lucide-react";
import type { Metadata } from "next";
import type { CoachingLog } from "@/types";

export const metadata: Metadata = { title: "Coaching" };

export default async function CoachingPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const { data: coaching } = await supabase
    .from("coaching_logs")
    .select("*, employees(name), manager:users!manager_id(email)")
    .order("created_at", { ascending: false });

  const grouped = (coaching ?? []).reduce<Record<string, typeof coaching>>((acc, log) => {
    const empName = (log.employees as { name: string } | null)?.name ?? "Unknown";
    if (!acc[empName]) acc[empName] = [];
    acc[empName]!.push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching Logs</h1>
          <p className="text-gray-500 mt-1">AI-generated and manual coaching suggestions</p>
        </div>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([empName, logs]) => (
            <div key={empName}>
              <h2 className="font-semibold text-gray-800 mb-3">{empName}</h2>
              <div className="space-y-3">
                {(logs ?? []).map((log) => (
                  <CoachingCard key={log.id} log={log as CoachingLog} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Brain size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">No coaching logs yet</p>
          <p className="text-sm mt-1">Generate AI coaching suggestions from an employee profile</p>
        </div>
      )}
    </div>
  );
}