"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { buildSystem, runAgent, type Overview } from "@/lib/aggregate-agent";
import { loadAiKey, subscribeAiKey } from "@/lib/aiKey";
import { newRecognizer, speechError, speechSupported, transcriptOf, type Recognizer } from "@/lib/speech";
import { noteTool, saveAsk } from "@/app/(app)/aggregate/actions";

const SUGGESTIONS = [
  "What themes keep coming up in my notes?",
  "What have I learned about God's mercy so far?",
  "How have I been applying what I read?",
  "Summarize what I wrote this week.",
];
const noop = () => () => {};

export default function AskForm({ overview, name }: { overview: Overview; name: string }) {
  const ai = useSyncExternalStore(subscribeAiKey, loadAiKey, () => null);
  const ready = useSyncExternalStore(noop, () => true, () => false); // false until the browser has loaded
  const canSpeak = useSyncExternalStore(noop, speechSupported, () => false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<Recognizer | null>(null);
  const heard = useRef("");
  const failed = useRef(false);
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

  async function ask(question: string) {
    if (!ai || question.trim().length < 3) return;
    setPending(true); setError("");
    const r = await runAgent({ question: question.trim(), key: ai.key, model: ai.model, system: buildSystem(name, overview), callTool: noteTool });
    if ("error" in r) { setError(r.error); setPending(false); return; }
    const saved = await saveAsk(question.trim(), r.answer, r.cited);
    if (saved.error) setError(saved.error); else setText("");
    setPending(false);
    router.refresh();
  }

  function startListening() {
    const r = newRecognizer();
    if (!r) return;
    heard.current = ""; failed.current = false;
    setError(""); setText("");
    r.onresult = (e) => { heard.current = transcriptOf(e); setText(heard.current); };
    r.onerror = (e) => { if (e.error !== "aborted") { failed.current = true; setError(speechError(e.error)); } };
    // When listening stops (Stop tapped, or the browser ends it), send what was heard straight to Claude.
    r.onend = () => {
      setListening(false);
      rec.current = null;
      if (!failed.current && heard.current.length >= 3) void ask(heard.current);
    };
    rec.current = r;
    try { r.start(); setListening(true); } catch { setError(speechError("")); }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void ask(text); }} className="card askform">
      <label htmlFor="question" className="asklabel">Ask about your notes</label>
      <textarea
        id="question" name="question" ref={box} rows={3} maxLength={500} value={text} disabled={off} readOnly={listening}
        placeholder={listening ? "Listening… speak your question" : canSpeak ? "Type a question, or tap Speak" : "e.g. What have I been learning about faith?"}
        onChange={(e) => setText(e.target.value)} style={{ overflow: "auto" }}
      />
      {!listening && (
        <div className="chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" disabled={off} onClick={() => { setText(s); box.current?.focus(); }}>{s}</button>
          ))}
        </div>
      )}
      {listening && <p className="listening"><span className="dot" aria-hidden /><span>Listening. Tap <strong>Stop and ask</strong> when you&rsquo;re done.</span></p>}
      {error && <p className="error">{error}</p>}
      <div className="row spread">
        <span className="muted small">Uses your Anthropic account</span>
        <div className="row">
          {canSpeak && (listening ? (
            <button type="button" className="btn stop" onClick={() => rec.current?.stop()}>■ Stop and ask</button>
          ) : (
            <button type="button" className="btn secondary" disabled={off} onClick={startListening} aria-label="Speak your question">🎤 Speak</button>
          ))}
          {!listening && <button className="btn" disabled={off || text.trim().length < 3}>{pending ? "Reading your notes…" : "Ask"}</button>}
        </div>
      </div>
    </form>
  );
}
