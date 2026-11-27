"use client";

import Link from "next/link";
import LocalTime from "@/components/LocalTime";
import { useEffect, useRef, useState, useTransition } from "react";
import { addQuestion, deleteItem, reorderItems, saveAnswer } from "@/app/(app)/notes/actions";

export type NoteItem = {
  id: string; kind: "generated" | "own"; source_key: string | null;
  question: string; question_2: string | null; answer: string; position: number;
  last_shared_at?: string | null; last_shared_group?: string | null;
};

const LABEL: Record<string, string> = { q1: "Observe", q2: "Connect", q3: "Respond" };

function AutoTextarea({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  }, [value]);
  return <textarea ref={ref} aria-label={label} value={value} placeholder="Write your answer…" onChange={(e) => onChange(e.target.value)} rows={3} />;
}

function Answer({ item, entryId }: { item: NoteItem; entryId: string }) {
  const [text, setText] = useState(item.answer);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(text);

  const flush = async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setStatus("saving");
    const res = await saveAnswer(item.id, entryId, latest.current);
    setStatus("error" in res ? "error" : "saved");
  };

  const onChange = (v: string) => {
    setText(v); latest.current = v; setStatus("");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  };

  // Save anything pending when leaving the page.
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void saveAnswer(item.id, entryId, latest.current); } }, [item.id, entryId]);

  return (
    <>
      <AutoTextarea value={text} onChange={onChange} label={item.question} />
      <div className="saved" aria-live="polite">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Not saved — check your connection" : ""}
      </div>
    </>
  );
}

export default function NoteEditor({ day, entryId, items: initial }: { day: number; entryId: string; items: NoteItem[] }) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  // Pick up server changes (e.g. after adding a question) without losing typing in other boxes.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) { setSeen(initial); setItems(initial); }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    start(async () => { await reorderItems(entryId, day, next.map((x) => x.id)); });
  };

  const remove = (id: string) => {
    if (!confirm("Delete this question and its answer?")) return;
    setItems(items.filter((x) => x.id !== id));
    start(async () => { await deleteItem(id, day); });
  };

  const add = () => {
    setError("");
    start(async () => {
      const res = await addQuestion(entryId, day, draft);
      if ("error" in res && res.error) setError(res.error); else setDraft("");
    });
  };

  return (
    <div className="card">
      {items.map((it, i) => (
        <div key={it.id} className="qa">
          <div className="spread">
            <span className="tag">{it.kind === "generated" ? LABEL[it.source_key ?? ""] ?? "Question" : "My question"}</span>
            <span className="row">
              <button className="btn ghost small" onClick={() => move(i, -1)} disabled={i === 0 || pending} aria-label="Move up">↑</button>
              <button className="btn ghost small" onClick={() => move(i, 1)} disabled={i === items.length - 1 || pending} aria-label="Move down">↓</button>
              <button className="btn ghost small" onClick={() => remove(it.id)} disabled={pending} aria-label="Delete question">✕</button>
            </span>
          </div>
          <p className="q">
            {it.question}
            {it.question_2 && <span className="q2line">{it.question_2}</span>}
          </p>
          <Answer item={it} entryId={entryId} />
          {it.last_shared_at ? (
            <div className="row small">
              <span className="tag shared">✓ Shared{it.last_shared_group ? ` with ${it.last_shared_group}` : ""} · <LocalTime iso={it.last_shared_at} /></span>
              <Link className="btn ghost small" href={`/notes/${day}/share?item=${it.id}`}>Share again</Link>
            </div>
          ) : (
            <Link className="btn ghost small" href={`/notes/${day}/share?item=${it.id}`}>Share a copy</Link>
          )}
        </div>
      ))}

      <div className="qa">
        <label htmlFor="own-q">Add my own question</label>
        <textarea id="own-q" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="What else do you want to think about from today's reading?" />
        {error && <p className="error small">{error}</p>}
        <div style={{ marginTop: ".5rem" }}>
          <button className="btn secondary" onClick={add} disabled={pending || !draft.trim()}>Add question</button>
        </div>
      </div>
    </div>
  );
}
