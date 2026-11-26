import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/talk/ConfirmButton";
import CopyLink from "@/components/talk/CopyLink";
import TodayThreadLink from "@/components/talk/TodayThreadLink";
import { deleteGroup, leaveGroup, regenerateInvite, removeMember } from "../actions";
import { requireMember } from "@/lib/data";
import { inviteUrl, memberNames, timeAgo, type Group } from "@/lib/groups";
import { siteUrl } from "@/lib/supabase/env";

export default async function GroupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const created = Boolean((await searchParams).created);
  const { supabase, user, profile } = await requireMember();
  const { data: g } = await supabase.from("groups").select("id, name, owner_id, invite_token, created_at").eq("id", id).maybeSingle();
  if (!g) notFound();
  const group = g as Group;
  const isOwner = group.owner_id === user.id;
  const [names, { data: activity }, { data: days }] = await Promise.all([
    memberNames(supabase, id),
    supabase.rpc("group_thread_activity", { p_group: id }),
    supabase.from("plan_days").select("day, reading"),
  ]);
  const reading = new Map(((days ?? []) as { day: number; reading: string }[]).map((d) => [d.day, d.reading]));
  const origin = siteUrl() || `https://${(await headers()).get("host")}`;

  return (
    <article>
      <div className="eyebrow"><Link href="/groups">Talk It Over</Link></div>
      <h1>{group.name}</h1>
      {created && <p className="notice">Group created. Copy the invite link below and send it to the people you&rsquo;d like to join.</p>}

      <section className="card">
        <TodayThreadLink groupId={id} startDate={profile.start_date} />
        <p className="small muted" style={{ margin: ".6rem 0 0" }}>Members may be on different days. Each day has its own thread, so you can visit any day&rsquo;s conversation.</p>
      </section>

      <section className="card">
        <h2>Recent conversations</h2>
        {(activity ?? []).length === 0 ? (
          <p className="muted small">No posts yet. Start the conversation in today&rsquo;s thread.</p>
        ) : (
          <ul className="list">
            {(activity as { day: number; post_count: number; last_post_at: string }[]).map((a) => (
              <li key={a.day}>
                <Link href={`/groups/${id}/day/${a.day}`}>
                  <div className="spread">
                    <span><strong>Day {a.day}</strong> · {reading.get(a.day)}</span>
                    <span className="small muted">{a.post_count} post{a.post_count === 1 ? "" : "s"} · {timeAgo(a.last_post_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Members ({names.size})</h2>
        <ul className="list members">
          {[...names.entries()].map(([uid, name]) => (
            <li key={uid}>
              <span>{name}{uid === user.id ? " (you)" : ""} {uid === group.owner_id && <span className="tag">Owner</span>}</span>
              {isOwner && uid !== user.id && (
                <ConfirmButton action={removeMember.bind(null, id, uid)} message={`Remove ${name} from the group? Their posts stay unless you delete them.`} className="btn ghost small">Remove</ConfirmButton>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Invite people</h2>
        <p className="small muted">Anyone with this link who signs in to ScriptureIQ can join. Share it only with people you want in the group.</p>
        <CopyLink url={inviteUrl(origin, group.invite_token)} />
        {isOwner && (
          <div style={{ marginTop: ".6rem" }}>
            <ConfirmButton action={regenerateInvite.bind(null, id)} message="Make a new invite link? The current link will stop working." className="btn ghost small">Make a new link</ConfirmButton>
          </div>
        )}
      </section>

      <section className="card">
        {isOwner ? (
          <ConfirmButton action={deleteGroup.bind(null, id)} message={`Delete "${group.name}" and all its conversations for everyone? This can't be undone.`} className="btn secondary">Delete group</ConfirmButton>
        ) : (
          <ConfirmButton action={leaveGroup.bind(null, id)} message={`Leave "${group.name}"? You'll need a new invite to rejoin.`} className="btn secondary">Leave group</ConfirmButton>
        )}
      </section>
    </article>
  );
}
