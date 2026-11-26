import Link from "next/link";
import { notFound } from "next/navigation";
import ShareForm from "@/components/talk/ShareForm";
import { getPlanDay, requireMember } from "@/lib/data";
import { myGroups } from "@/lib/groups";
import { parseDayParam } from "@/lib/plan";

/**
 * "Share a copy": builds an editable copy of one note answer for a group thread. The post is a
 * separate piece of text; it keeps no link to the private note, and later edits to either don't affect the other.
 */
export default async function SharePage({ params, searchParams }: { params: Promise<{ day: string }>; searchParams: Promise<{ item?: string }> }) {
  const day = parseDayParam((await params).day);
  const itemId = (await searchParams).item;
  if (!day || !itemId) notFound();
  const { supabase } = await requireMember();
  const [d, groups, { data: item }] = await Promise.all([
    getPlanDay(supabase, day),
    myGroups(supabase),
    supabase.from("note_items").select("question, question_2, answer").eq("id", itemId).maybeSingle(),
  ]);
  if (!item) notFound();
  const question = [item.question, item.question_2].filter(Boolean).join(" ");
  const draft = item.answer.trim() ? `${question}\n\n${item.answer.trim()}` : `${question}\n\n`;

  return (
    <article>
      <div className="eyebrow"><Link href={`/notes/${day}`}>Day {day} notes</Link></div>
      <h1>Share a copy</h1>
      <p className="muted small">This sends a separate copy to a group&rsquo;s Day {day} conversation ({d.reading}). Edit it as much as you like first. Your private note stays as it is.</p>
      {groups.length === 0 ? (
        <div className="card">
          <p>You&rsquo;re not in a group yet.</p>
          <Link className="btn" href="/groups">Start or join a group</Link>
        </div>
      ) : (
        <ShareForm day={day} itemId={itemId} groups={groups.map((g) => ({ id: g.id, name: g.name }))} draft={draft} />
      )}
    </article>
  );
}
