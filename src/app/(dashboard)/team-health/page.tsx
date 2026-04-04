import { createClient } from "@/lib/supabase/server";
import TeamHealthGauge from "@/components/TeamHealthGauge";
import { Activity } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Health" };

export default async function TeamHealthPage() {
  const supabase = createClient();

  const { data: healthRecords } = await supabase
    .from("team_health")
    .select("*")
    .gte("measured_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("measured_at", { ascending: false });

  const latestByTeam = (healthRecords ?? []).reduce<Record<string, typeof healthRecords extends null ? never : NonNullable<typeof healthRecords>[0]>>((acc, record) => {
    if (!acc[record.team_id]) acc[record.team_id] = record;
    return acc;
  }, {});

  const teams = Object.values(latestByTeam);

  const orgAvg =
    teams.length > 0
      ? Math.round(teams.reduce((s, t) => s + t.score, 0) / teams.length)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Health</h1>
          <p className="text-gray-500 mt-1">Daily composite scores across all departments</p>
        </div>
        {orgAvg > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{orgAvg}</div>
            <div className="text-xs text-gray-400">Org Average</div>
          </div>
        )}
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamHealthGauge
              key={team.id}
              teamId={team.team_id}
              score={team.score}
              factors={team.factors as Record<string, number>}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Activity size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">No team health data yet</p>
          <p className="text-sm mt-1">Health scores are calculated daily at 8am UTC</p>
        </div>
      )}
    </div>
  );
}