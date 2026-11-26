import Link from "next/link";
import { answerParts } from "@/lib/aggregate-cite";
import { deleteAsk } from "@/app/(app)/aggregate/actions";
import ConfirmButton from "@/components/talk/ConfirmButton";

export type Ask = { id: string; question: string; answer: string; cited_days: number[]; created_at: string };

export default function AskItem({ a, open }: { a: Ask; open: boolean }) {
  const when = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <details className="card askitem" open={open}>
      <summary>
        <span className="q">{a.question}</span>
        <span className="muted small">{when}</span>
      </summary>
      <p className="voice muted small">Drafted in your voice from your notes</p>
      {a.answer.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {answerParts(para).map((p, j) =>
            "day" in p ? <Link key={j} className="cite" href={`/notes/${p.day}`}>Day {p.day}</Link> : <span key={j}>{p.text}</span>,
          )}
        </p>
      ))}
      <div className="row spread">
        <span className="muted small">{a.cited_days.length ? `From ${a.cited_days.length} day${a.cited_days.length > 1 ? "s" : ""} of notes` : "No notes cited"}</span>
        <ConfirmButton action={deleteAsk.bind(null, a.id)} className="btn ghost small" message="Delete this question and answer?">Delete</ConfirmButton>
      </div>
    </details>
  );
}
