import { redirect } from "next/navigation";
import Landing from "@/components/Landing";
import { requireMember } from "@/lib/data";

export const metadata = { title: "ScriptureIQ · Know Him More" };

/** The landing page: brand, study name, today's day button and a strip of all 358 days. */
export default async function Home() {
  const { supabase, profile } = await requireMember();
  if (!profile.start_date) redirect("/settings?welcome=1");
  const { data } = await supabase.from("day_progress").select("day").not("completed_at", "is", null);
  return <Landing startDate={profile.start_date} completed={(data ?? []).map((r) => r.day as number)} />;
}
