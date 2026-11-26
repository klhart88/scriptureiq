import Link from "next/link";
import SettingsForm from "@/components/SettingsForm";
import VoiceSettings from "@/components/VoiceSettings";
import { requireMember } from "@/lib/data";
import { signOut } from "@/app/login/actions";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const welcome = Boolean((await searchParams).welcome);
  const { user, profile } = await requireMember();
  return (
    <article>
      <h1>{welcome ? "Welcome to ScriptureIQ" : "Settings"}</h1>
      {welcome && <p className="muted">Choose the day you begin the plan. Day 1 falls on that date, and each day after follows in order.</p>}
      <SettingsForm displayName={profile.display_name} startDate={profile.start_date} welcome={welcome} />
      {!welcome && <VoiceSettings />}
      <section className="card">
        <div className="eyebrow">Signed in as</div>
        <p>{user.email}</p>
        <div className="row">
          <Link className="btn secondary" href="/settings/password">Change password</Link>
          <form action={signOut}><button className="btn ghost">Sign out</button></form>
        </div>
      </section>
      <section className="card small muted">
        <p>Your notes, reading progress and answers are private to your account. Only posts you write in a group are seen by that group.</p>
        <p style={{ marginBottom: 0 }}>Reading plan, videos and links: BibleProject, <em>One Story That Leads to Jesus</em>. BibleProject is the author and owner of this content. To find more BibleProject resources, visit bibleproject.com.</p>
      </section>
    </article>
  );
}
