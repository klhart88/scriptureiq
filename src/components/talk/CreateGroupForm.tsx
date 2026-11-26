"use client";

import { useActionState } from "react";
import { createGroup, type FormState } from "@/app/(app)/groups/actions";

export default function CreateGroupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createGroup, {});
  return (
    <form action={action} className="card">
      <h2>Start a group</h2>
      <p className="small muted">You&rsquo;ll get an invite link to send to the people you want in it.</p>
      <div className="field">
        <label htmlFor="group-name">Group name</label>
        <input id="group-name" name="name" maxLength={80} placeholder="e.g. Tuesday night group" required />
      </div>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn" disabled={pending}>Create group</button>
    </form>
  );
}
