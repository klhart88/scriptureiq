import Link from "next/link";
import { notFound } from "next/navigation";
import AutoRefresh from "@/components/talk/AutoRefresh";
import PostComposer from "@/components/talk/PostComposer";
import PostItem from "@/components/talk/PostItem";
import { getPlanDay, requireMember } from "@/lib/data";
import { memberNames, timeAgo, type Group, type Post } from "@/lib/groups";
import { parseDayParam, TOTAL_DAYS } from "@/lib/plan";

export default async function ThreadPage({ params, searchParams }: { params: Promise<{ id: string; day: string }>; searchParams: Promise<{ shared?: string }> }) {
  const { id, day: rawDay } = await params;
  const shared = Boolean((await searchParams).shared);
  const day = parseDayParam(rawDay);
  if (!day) notFound();
  const { supabase, user } = await requireMember();
  const { data: g } = await supabase.from("groups").select("id, name, owner_id").eq("id", id).maybeSingle();
  if (!g) notFound();
  const group = g as Pick<Group, "id" | "name" | "owner_id">;
  const [d, names, { data: rows }] = await Promise.all([
    getPlanDay(supabase, day),
    memberNames(supabase, id),
    supabase.from("posts").select("id, group_id, day, author_id, body, created_at, updated_at").eq("group_id", id).eq("day", day).order("created_at"),
  ]);
  const posts = (rows ?? []) as Post[];

  return (
    <article>
      <AutoRefresh />
      <div className="eyebrow"><Link href="/groups">Talk It Over</Link> · <Link href={`/groups/${id}`}>{group.name}</Link></div>
      <h1>Day {day} · {d.reading}</h1>
      <p className="small"><Link href={`/day/${day}`}>Open this day&rsquo;s reading</Link> · <Link href={`/notes/${day}`}>My notes for this day</Link></p>

      <details className="card questions">
        <summary>This day&rsquo;s reflection questions</summary>
        <ol>
          <li>{d.q1}</li>
          <li>{d.q2_connect}{d.q2_reveal ? <> {d.q2_reveal}</> : null}</li>
          <li>{d.q3}</li>
        </ol>
      </details>

      {shared && <p className="notice">Your copy was shared with the group.</p>}

      {posts.length === 0 ? (
        <p className="muted">No one has posted on Day {day} yet.</p>
      ) : (
        <ul className="posts">
          {posts.map((p) => (
            <PostItem
              key={p.id}
              id={p.id}
              groupId={id}
              day={day}
              author={p.author_id === user.id ? "You" : names.get(p.author_id) ?? "Former member"}
              when={timeAgo(p.created_at)}
              edited={new Date(p.updated_at).getTime() - new Date(p.created_at).getTime() > 5000}
              body={p.body}
              canEdit={p.author_id === user.id}
              canDelete={p.author_id === user.id || group.owner_id === user.id}
            />
          ))}
        </ul>
      )}

      <PostComposer groupId={id} day={day} />

      <nav className="dayfooter" aria-label="Other days">
        {day > 1 ? <Link href={`/groups/${id}/day/${day - 1}`}>← Day {day - 1}</Link> : <span />}
        {day < TOTAL_DAYS ? <Link href={`/groups/${id}/day/${day + 1}`}>Day {day + 1} →</Link> : <span />}
      </nav>
    </article>
  );
}
