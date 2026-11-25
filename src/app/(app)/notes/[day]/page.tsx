import Link from "next/link";
import { notFound } from "next/navigation";
import NoteEditor from "@/components/NoteEditor";
import { getPlanDay, requireMember } from "@/lib/data";
import { dateForDay, formatDate, parseDayParam, TOTAL_DAYS } from "@/lib/plan";

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
      <div className="eyebrow">
        <Link href="/notes">My Study Notes</Link> · Day {day}
        {profile.start_date && <> · {formatDate(dateForDay(profile.start_date, day))}</>}
      </div>
      <h1>{d.reading}</h1>
      <p className="small"><Link href={`/day/${day}/read`}>Jump to this day&rsquo;s reading</Link></p>
      <NoteEditor key={entryId as string} day={day} entryId={entryId as string} items={items ?? []} />
      <nav className="spread small" aria-label="Other days" style={{ marginTop: "1rem" }}>
        {day > 1 ? <Link href={`/notes/${day - 1}`}>← Day {day - 1}</Link> : <span />}
        {day < TOTAL_DAYS ? <Link href={`/notes/${day + 1}`}>Day {day + 1} →</Link> : <span />}
      </nav>
    </article>
  );
}
