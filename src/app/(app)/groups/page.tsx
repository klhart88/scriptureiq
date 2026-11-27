import Link from "next/link";
import CreateGroupForm from "@/components/talk/CreateGroupForm";
import TodayThreadLink from "@/components/talk/TodayThreadLink";
import { requireMember } from "@/lib/data";

type GroupRow = { id: string; name: string; owner_id: string; group_members: { count: number }[] };

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ left?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireMember();
  const { data } = await supabase.from("groups").select("id, name, owner_id, group_members(count)").order("created_at");
  const groups = (data ?? []) as GroupRow[];

  return (
    <article>
      <h1>Discuss It</h1>
      <p className="muted small">Each group has one conversation per plan day. Your notes stay private unless you choose <strong>Share a copy</strong>.</p>
      {sp.left && <p className="notice">You left the group.</p>}
      {sp.deleted && <p className="notice">The group was deleted.</p>}

      {groups.length > 0 && (
        <>
          <h2 style={{ marginTop: "1.25rem" }}>Your groups</h2>
          {groups.map((g) => {
            const count = g.group_members[0]?.count ?? 1;
            return (
              <section key={g.id} className="card groupcard">
                <div className="spread">
                  <div>
                    <h3 style={{ margin: 0 }}><Link href={`/groups/${g.id}`}>{g.name}</Link></h3>
                    <p className="small muted" style={{ margin: ".15rem 0 0" }}>{count} member{count === 1 ? "" : "s"}</p>
                  </div>
                  {g.owner_id === user.id && <span className="tag">Owner</span>}
                </div>
                <div className="row" style={{ marginTop: ".8rem" }}>
                  <TodayThreadLink groupId={g.id} startDate={profile.start_date} />
                  <Link className="btn secondary" href={`/groups/${g.id}`}>Open group</Link>
                </div>
              </section>
            );
          })}
        </>
      )}

      {groups.length > 0 ? (
        <details className="startgroup">
          <summary className="btn ghost">+ Start another group</summary>
          <CreateGroupForm />
        </details>
      ) : (
        <CreateGroupForm />
      )}
      <p className="small muted">Joining someone else&rsquo;s group? Open the invite link they sent you.</p>
    </article>
  );
}
