import Link from "next/link";
import { requireMember } from "@/lib/data";
import { asksInLastDay, DAILY_LIMIT, FEW_NOTES, notesOverview } from "@/lib/aggregate";
import { anthropicKey } from "@/lib/supabase/env";
import AskForm from "@/components/aggregate/AskForm";
import AskItem, { type Ask } from "@/components/aggregate/AskItem";

export const metadata = { title: "Study Aggregate · ScriptureIQ" };
// Answers can take a little while: Claude searches your notes a few times before writing.
export const maxDuration = 60;

export default async function AggregatePage() {
  const { supabase } = await requireMember();
  const [overview, { data: asks }, count] = await Promise.all([
    notesOverview(supabase),
    supabase.from("aggregate_asks").select("id, question, answer, cited_days, created_at").order("created_at", { ascending: false }).limit(30),
    asksInLastDay(supabase),
  ]);
  const configured = Boolean(anthropicKey());
  const remaining = Math.max(0, DAILY_LIMIT - count);
  const list = (asks ?? []) as Ask[];

  return (
    <>
      <h1>Study Aggregate</h1>
      <p className="muted">Ask about your own study notes. Answers are drafted in your voice from what you&rsquo;ve written, with links to the days they came from.</p>

      <div className="disclosure">
        <span className="tag">Early version</span>
        <p>
          Study Aggregate only knows what you&rsquo;ve written in My Study Notes. With few notes, answers will be brief or
          general; they become more personal as your notes build up.
        </p>
      </div>

      <div className="card stats">
        <div><strong>{overview.answered}</strong><span className="muted small">reflections answered</span></div>
        <div><strong>{overview.days}</strong><span className="muted small">days with notes</span></div>
        <div><strong>{overview.books ? overview.books.split(", ").length : 0}</strong><span className="muted small">books</span></div>
      </div>

      {!configured ? (
        <div className="card">
          <h3>Not switched on yet</h3>
          <p className="muted">Study Aggregate needs an Anthropic API key before it can answer. Everything else in ScriptureIQ works without it.</p>
        </div>
      ) : overview.answered === 0 ? (
        <div className="card">
          <h3>Nothing to draw from yet</h3>
          <p className="muted">Answer a few reflection questions in My Study Notes, then come back and ask what you&rsquo;ve been learning.</p>
          <Link className="btn" href="/today">Go to today&rsquo;s reading</Link>
        </div>
      ) : overview.answered < FEW_NOTES ? (
        <p className="hint">You&rsquo;ve answered {overview.answered} reflection{overview.answered === 1 ? "" : "s"} so far, so answers will be limited.</p>
      ) : null}

      <AskForm disabled={!configured || overview.answered === 0 || remaining === 0} remaining={remaining} />

      {list.length > 0 && (
        <>
          <h2 className="section">Your past questions</h2>
          {list.map((a, i) => <AskItem key={a.id} a={a} open={i === 0} />)}
        </>
      )}

      <p className="muted small footnote">
        When you ask, your question and the notes it needs are sent to Anthropic&rsquo;s Claude to write the answer. Your
        questions and answers are saved privately to your account; delete any of them at any time.
      </p>
    </>
  );
}
