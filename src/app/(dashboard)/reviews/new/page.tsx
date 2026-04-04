import ReviewForm from "@/components/ReviewForm";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Employee } from "@/types";

export const metadata: Metadata = { title: "New Review" };

export default async function NewReviewPage() {
  const supabase = createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, department")
    .order("name");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Performance Review</h1>
        <p className="text-gray-500 mt-1">
          AI bias detection runs automatically after submission
        </p>
      </div>
      <ReviewForm employees={(employees ?? []) as Employee[]} />
    </div>
  );
}