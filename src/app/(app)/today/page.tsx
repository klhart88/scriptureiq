import { redirect } from "next/navigation";
import TodayRedirect from "@/components/TodayRedirect";
import { requireMember } from "@/lib/data";

export default async function Today() {
  const { profile } = await requireMember();
  if (!profile.start_date) redirect("/settings?welcome=1");
  return <TodayRedirect startDate={profile.start_date} />;
}
