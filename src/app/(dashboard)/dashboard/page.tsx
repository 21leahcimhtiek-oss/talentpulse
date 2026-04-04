import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Users, ClipboardList, Activity, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { count: employeeCount },
    { data: okrs },
    { count: reviewCount },
    { data: teamHealth },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("okrs").select("status, current, target"),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("team_health")
      .select("score")
      .gte("measured_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalOkrs = okrs?.length ?? 0;
  const onTrackOkrs = okrs?.filter((o) => o.status === "on_track" || o.status === "achieved").length ?? 0;
  const atRiskOkrs = okrs?.filter((o) => o.status === "at_risk").length ?? 0;
  const okrOnTrackPct = totalOkrs > 0 ? Math.round((onTrackOkrs / totalOkrs) * 100) : 0;
  const avgHealthScore =
    teamHealth && teamHealth.length > 0
      ? Math.round(teamHealth.reduce((s, t) => s + t.score, 0) / teamHealth.length)
      : 0;

  const stats = [
    {
      label: "Total Employees",
      value: employeeCount ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "OKRs On Track",
      value: `${okrOnTrackPct}%`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-100",
      sub: `${atRiskOkrs} at risk`,
    },
    {
      label: "Reviews (30d)",
      value: reviewCount ?? 0,
      icon: ClipboardList,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Avg Team Health",
      value: avgHealthScore > 0 ? `${avgHealthScore}/100` : "—",
      icon: Activity,
      color: "text-indigo-600 bg-indigo-100",
    },
  ];

  const atRiskList = okrs
    ?.filter((o) => o.status === "at_risk")
    .slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Organization-wide performance snapshot</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <span className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={18} />
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            {stat.sub && <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>}
          </div>
        ))}
      </div>

      {atRiskList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h2 className="font-semibold text-gray-900">At-Risk OKRs</h2>
            <span className="ml-auto text-xs text-gray-400">{atRiskList.length} items</span>
          </div>
          <div className="space-y-3">
            {atRiskList.map((okr, i) => {
              const pct = okr.target > 0 ? Math.round((okr.current / okr.target) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">OKR</span>
                      <span className="text-yellow-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}