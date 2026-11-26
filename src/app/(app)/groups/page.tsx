import Link from "next/link";
import CreateGroupForm from "@/components/talk/CreateGroupForm";
import { requireMember } from "@/lib/data";
import { myGroups } from "@/lib/groups";

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ left?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireMember();
  const groups = await myGroups(supabase);

  return (
    <article>
      <h1>Talk It Over</h1>
      <p className="muted small">The only shared space in ScriptureIQ. Each group has one conversation per plan day. Your notes stay private unless you choose <strong>Share a copy</strong>.</p>
      {sp.left && <p className="notice">You left the group.</p>}
      {sp.deleted && <p className="notice">The group was deleted.</p>}

      {groups.length > 0 && (
        <ul className="list card">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`}>
                <div className="spread">
                  <strong>{g.name}</strong>
                  {g.owner_id === user.id && <span className="tag">Owner</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateGroupForm />
      <p className="small muted">Joining someone else&rsquo;s group? Open the invite link they sent you.</p>
    </article>
  );
}
