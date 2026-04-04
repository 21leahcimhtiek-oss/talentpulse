import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import type { UserRole } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role, orgs(name, plan, slug)")
    .eq("id", user.id)
    .single();

  if (!userData) redirect("/login");

  const org = userData.orgs as { name: string; plan: string; slug: string } | null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        user={{ email: user.email ?? "", role: userData.role as UserRole }}
        org={org ?? { name: "My Org", plan: "starter", slug: "my-org" }}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}