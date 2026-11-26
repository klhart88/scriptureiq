"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "@/app/(app)/settings/actions";

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SettingsForm({ displayName, startDate, welcome }: { displayName: string; startDate: string | null; welcome: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  return (
    // Keyed by the saved values: after a save the form remounts showing what was stored, not the old default.
    <form key={`${displayName}|${startDate}`} action={action} className="card">
      {welcome && <input type="hidden" name="welcome" value="1" />}
      <div className="field">
        <label htmlFor="display_name">Your name</label>
        <input id="display_name" name="display_name" defaultValue={displayName} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="start_date">Plan start date (Day 1)</label>
        <input id="start_date" name="start_date" type="date" defaultValue={startDate ?? localToday()} required suppressHydrationWarning />
        <p className="small muted">Changing this moves which day counts as today. Your notes and progress stay with their plan day.</p>
      </div>
      {state.error && <p className="error">{state.error}</p>}
      {state.notice && <p className="notice">{state.notice}</p>}
      <button className="btn" disabled={pending}>{welcome ? "Start the plan" : "Save"}</button>
    </form>
  );
}
