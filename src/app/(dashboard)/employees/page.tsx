import { createClient } from "@/lib/supabase/server";
import EmployeeCard from "@/components/EmployeeCard";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { Employee } from "@/types";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { department?: string; search?: string };
}) {
  const supabase = createClient();

  let query = supabase.from("employees").select("*").order("name");
  if (searchParams.department) query = query.eq("department", searchParams.department);
  if (searchParams.search) query = query.ilike("name", `%${searchParams.search}%`);

  const { data: employees } = await query;
  const { data: depts } = await supabase
    .from("employees")
    .select("department")
    .neq("department", "");

  const uniqueDepts = [...new Set((depts ?? []).map((d) => d.department).filter(Boolean))].sort();

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  const canAdd = userData?.role === "admin" || userData?.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">{employees?.length ?? 0} team members</p>
        </div>
        {canAdd && (
          <Link
            href="/employees/new"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus size={16} />
            Add Employee
          </Link>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          href="/employees"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !searchParams.department
              ? "bg-primary-100 text-primary-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {uniqueDepts.map((dept) => (
          <Link
            key={dept}
            href={`/employees?department=${encodeURIComponent(dept)}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.department === dept
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {dept}
          </Link>
        ))}
      </div>

      {employees && employees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee as Employee} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">No employees found</p>
          <p className="text-sm mt-1">
            {searchParams.search || searchParams.department
              ? "Try adjusting your filters"
              : "Add your first employee to get started"}
          </p>
        </div>
      )}
    </div>
  );
}