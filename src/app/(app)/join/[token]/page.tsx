import Link from "next/link";
import { joinGroup } from "@/app/(app)/groups/actions";
import { requireMember } from "@/lib/data";

export default async function JoinPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const failed = Boolean((await searchParams).error);
  const { supabase } = await requireMember();
  const { data } = await supabase.rpc("invite_preview", { p_token: token });
  const g = (data ?? [])[0] as { group_id: string; name: string; member_count: number; already_member: boolean } | undefined;

  if (!g) {
    return (
      <article className="card">
        <h1>Invite not found</h1>
        <p>This invite link is no longer valid. The group owner may have made a new one. Ask them to send it again.</p>
        <Link className="btn secondary" href="/groups">Go to Talk It Over</Link>
      </article>
    );
  }
  if (g.already_member) {
    return (
      <article className="card">
        <h1>{g.name}</h1>
        <p>You&rsquo;re already a member of this group.</p>
        <Link className="btn" href={`/groups/${g.group_id}`}>Open the group</Link>
      </article>
    );
  }
  return (
    <article className="card">
      <div className="eyebrow">Invitation</div>
      <h1>Join {g.name}?</h1>
      <p className="muted">{g.member_count} member{g.member_count === 1 ? "" : "s"}. Members can see your name and the posts you write in this group. Your notes stay private.</p>
      {failed && <p className="error">That didn&rsquo;t work. The link may have just changed; ask for a new one.</p>}
      <form action={joinGroup.bind(null, token)}>
        <button className="btn">Join group</button>
      </form>
    </article>
  );
}
