import { createClient } from "@/lib/supabase/server";
import OKRCard from "@/components/OKRCard";
import { Target } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { OKR, OKRStatus } from "@/types";

export const metadata: Metadata = { title: "OKRs" };

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "On Track", value: "on_track" },
  { label: "At Risk", value: "at_risk" },
  { label: "Missed", value: "missed" },
  { label: "Achieved", value: "achieved" },
];

export default async function OKRsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const status = searchParams.status;

  let query = supabase
    .from("okrs")
    .select("*, employees(name)")
    .order("due_date");

  if (status && status !== "all") {
    query = query.eq("status", status as OKRStatus);
  }

  const { data: okrs } = await query;

  const total = okrs?.length ?? 0;
  const onTrack = okrs?.filter((o) => o.status === "on_track").length ?? 0;
  const atRisk = okrs?.filter((o) => o.status === "at_risk").length ?? 0;
  const achieved = okrs?.filter((o) => o.status === "achieved").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OKRs</h1>
          <p className="text-gray-500 mt-1">{total} objectives</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "text-gray-700" },
          { label: "On Track", value: onTrack, color: "text-green-600" },
          { label: "At Risk", value: atRisk, color: "text-yellow-600" },
          { label: "Achieved", value: achieved, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/okrs" : `/okrs?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (!status && f.value === "all") || status === f.value
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {okrs && okrs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {okrs.map((okr) => (
            <OKRCard
              key={okr.id}
              okr={okr as OKR}
              employeeName={(okr.employees as { name: string } | null)?.name}
              showEmployee
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Target size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">No OKRs found</p>
          <p className="text-sm mt-1">
            {status ? "Try a different status filter" : "Create OKRs for your team to get started"}
          </p>
        </div>
      )}
    </div>
  );
}