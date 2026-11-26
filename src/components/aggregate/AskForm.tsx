"use client";

import { useActionState, useRef, useState } from "react";
import { ask, type AskState } from "@/app/(app)/aggregate/actions";

const SUGGESTIONS = [
  "What themes keep coming up in my notes?",
  "What have I learned about God's mercy so far?",
  "How have I been applying what I read?",
  "Summarize what I wrote this week.",
];

export default function AskForm({ disabled, remaining }: { disabled: boolean; remaining: number }) {
  const [state, action, pending] = useActionState<AskState, FormData>(ask, {});
  const [text, setText] = useState("");
  const [lastAsked, setLastAsked] = useState<number | undefined>(undefined);
  const box = useRef<HTMLTextAreaElement>(null);
  // Clear the box once a question has been answered and saved.
  if (state.askedAt && state.askedAt !== lastAsked) {
    setLastAsked(state.askedAt);
    setText("");
  }
  const off = disabled || pending;
  return (
    <form action={action} className="card askform">
      <label htmlFor="question" className="asklabel">Ask about your notes</label>
      <textarea
        id="question" name="question" ref={box} rows={3} maxLength={500} value={text} disabled={off}
        placeholder="e.g. What have I been learning about faith?"
        onChange={(e) => setText(e.target.value)}
        style={{ overflow: "auto" }}
      />
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" disabled={off} onClick={() => { setText(s); box.current?.focus(); }}>
            {s}
          </button>
        ))}
      </div>
      {state.error && <p className="error">{state.error}</p>}
      <div className="row spread">
        <span className="muted small">{remaining} questions left today</span>
        <button className="btn" disabled={off || text.trim().length < 3}>{pending ? "Reading your notes…" : "Ask"}</button>
      </div>
    </form>
  );
}
