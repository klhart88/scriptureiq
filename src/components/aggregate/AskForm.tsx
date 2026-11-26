"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { buildSystem, runAgent, type Overview } from "@/lib/aggregate-agent";
import { loadAiKey, subscribeAiKey } from "@/lib/aiKey";
import { noteTool, saveAsk } from "@/app/(app)/aggregate/actions";

const SUGGESTIONS = [
  "What themes keep coming up in my notes?",
  "What have I learned about God's mercy so far?",
  "How have I been applying what I read?",
  "Summarize what I wrote this week.",
];

export default function AskForm({ overview, name }: { overview: Overview; name: string }) {
  const ai = useSyncExternalStore(subscribeAiKey, loadAiKey, () => null);
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false); // false until the browser has loaded
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  if (ready && !ai) {
    return (
      <div className="card">
        <h3>Optional: use your own Anthropic account</h3>
        <p className="muted">
          Study Aggregate runs on Claude, using an Anthropic API key from your own account. You pay Anthropic directly for
          what you use, typically a few cents a question. Your key is saved only on this device.
        </p>
        <Link className="btn" href="/settings#aggregate">Set up in Settings</Link>
      </div>
    );
  }

  const off = !ready || pending || overview.answered === 0;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ai || text.trim().length < 3) return;
    setPending(true); setError("");
    const r = await runAgent({ question: text.trim(), key: ai.key, model: ai.model, system: buildSystem(name, overview), callTool: noteTool });
    if ("error" in r) { setError(r.error); setPending(false); return; }
    const saved = await saveAsk(text.trim(), r.answer, r.cited);
    if (saved.error) setError(saved.error); else setText("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card askform">
      <label htmlFor="question" className="asklabel">Ask about your notes</label>
      <textarea
        id="question" name="question" ref={box} rows={3} maxLength={500} value={text} disabled={off}
        placeholder="e.g. What have I been learning about faith?" onChange={(e) => setText(e.target.value)} style={{ overflow: "auto" }}
      />
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" disabled={off} onClick={() => { setText(s); box.current?.focus(); }}>{s}</button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="row spread">
        <span className="muted small">Uses your Anthropic account</span>
        <button className="btn" disabled={off || text.trim().length < 3}>{pending ? "Reading your notes…" : "Ask"}</button>
      </div>
    </form>
  );
}
