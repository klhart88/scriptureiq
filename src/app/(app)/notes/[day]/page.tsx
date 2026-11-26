import Link from "next/link";
import { notFound } from "next/navigation";
import DayNav from "@/components/DayNav";
import NoteEditor from "@/components/NoteEditor";
import { getPlanDay, requireMember } from "@/lib/data";
import { dateForDay, formatDate, parseDayParam } from "@/lib/plan";

export default async function NoteEntryPage({ params }: { params: Promise<{ day: string }> }) {
  const day = parseDayParam((await params).day);
  if (!day) notFound();
  const { supabase, profile } = await requireMember();
  const d = await getPlanDay(supabase, day);
  const { data: entryId, error } = await supabase.rpc("open_note_entry", { p_day: day });
  if (error || !entryId) throw new Error(error?.message ?? "Could not open this day's notes");
  const { data: items } = await supabase.from("note_items")
    .select("id, kind, source_key, question, question_2, answer, position, updated_at")
    .eq("entry_id", entryId).order("position");

  return (
    <article>
      <DayNav day={day} step="reflections" />
      <div className="eyebrow">
        <Link href="/notes">My Study Notes</Link> · Day {day}
        {profile.start_date && <> · {formatDate(dateForDay(profile.start_date, day))}</>}
      </div>
      <h1>{d.reading}</h1>
      <NoteEditor key={entryId as string} day={day} entryId={entryId as string} items={items ?? []} />
    </article>
  );
}
