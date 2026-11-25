import CalendarGrid from "@/components/CalendarGrid";
import { requireMember } from "@/lib/data";

export default async function CalendarPage() {
  const { supabase, profile } = await requireMember();
  const [{ data: days }, { data: progress }] = await Promise.all([
    supabase.from("plan_days").select("day, section").order("day"),
    supabase.from("day_progress").select("day").not("completed_at", "is", null),
  ]);
  const groups: { section: string; days: number[] }[] = [];
  for (const d of days ?? []) {
    const section = d.section ?? "Plan";
    if (groups.at(-1)?.section !== section) groups.push({ section, days: [] });
    groups.at(-1)!.days.push(d.day);
  }
  return (
    <article>
      <h1>Calendar</h1>
      {!profile.start_date && <p className="muted">Set your start date in Settings to see dates and today&rsquo;s reading.</p>}
      <CalendarGrid startDate={profile.start_date} completed={(progress ?? []).map((p) => p.day)} groups={groups} />
    </article>
  );
}
