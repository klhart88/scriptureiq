"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteState } from "@/app/(app)/settings/actions";
import { saveAiKey } from "@/lib/aiKey";

/** Permanently deletes the member's account. They must type DELETE to confirm. */
export default function DeleteAccount() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  return (
    <section className="card danger">
      <h2>Delete my account</h2>
      {!open ? (
        <>
          <p className="muted small">Permanently remove your ScriptureIQ account and everything in it.</p>
          <button type="button" className="btn secondary danger-btn" onClick={() => setOpen(true)}>Delete my account…</button>
        </>
      ) : (
        <form action={action} onSubmit={() => { try { saveAiKey(null); localStorage.removeItem("siq.voice"); } catch {} }}>
          <p className="small">This can&rsquo;t be undone. It permanently deletes:</p>
          <ul className="small">
            <li>your study notes, reading progress and Study Aggregate answers;</li>
            <li>your posts in Talk It Over groups, and your membership in them;</li>
            <li>your sign-in, so this email address will need to sign up again to use ScriptureIQ.</li>
          </ul>
          <p className="small">Groups you own will pass to their longest-standing member. A group with no other members is deleted.</p>
          <div className="field">
            <label htmlFor="confirm_delete">Type DELETE to confirm</label>
            <input id="confirm_delete" name="confirm" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
          {state.error && <p className="error">{state.error}</p>}
          <div className="row">
            <button className="btn danger-solid" disabled={pending || typed.trim() !== "DELETE"}>{pending ? "Deleting…" : "Permanently delete"}</button>
            <button type="button" className="btn ghost" onClick={() => { setOpen(false); setTyped(""); }}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
