import Link from "next/link";
import { requireMember } from "@/lib/data";

type Row = { day: number; updated_at: string; plan_days: { reading: string; book: string | null } | null };

export default async function NotesIndex({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "book" ? "book" : "day";
  const { supabase } = await requireMember();
  const { data } = await supabase.from("note_entries").select("day, updated_at, plan_days(reading, book)").order("day");
  const rows = (data ?? []) as unknown as Row[];

  const byBook = new Map<string, Row[]>();
  for (const r of rows) {
    const b = r.plan_days?.book ?? "Other";
    byBook.set(b, [...(byBook.get(b) ?? []), r]);
  }

  const item = (r: Row) => (
    <li key={r.day}>
      <Link href={`/notes/${r.day}`}>
        <div className="spread">
          <span><strong>Day {r.day}</strong> · {r.plan_days?.reading}</span>
          <span className="small muted">{new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </Link>
    </li>
  );

  return (
    <article>
      <h1>My Study Notes</h1>
      <p className="muted small">Private to you. Each day&rsquo;s entry starts with its three reflection questions.</p>
      <div className="tabs">
        <Link href="/notes" aria-current={view === "day" ? "page" : undefined}>By day</Link>
        <Link href="/notes?view=book" aria-current={view === "book" ? "page" : undefined}>By book</Link>
      </div>
      {rows.length === 0 ? (
        <div className="card">
          <p>No entries yet. After today&rsquo;s reading, choose <strong>Write today&rsquo;s reflections</strong>.</p>
          <Link className="btn" href="/today">Go to today</Link>
        </div>
      ) : view === "day" ? (
        <ul className="list card">{rows.map(item)}</ul>
      ) : (
        [...byBook.entries()].map(([book, list]) => (
          <section key={book} className="card">
            <h2>{book}</h2>
            <ul className="list">{list.map(item)}</ul>
          </section>
        ))
      )}
    </article>
  );
}
