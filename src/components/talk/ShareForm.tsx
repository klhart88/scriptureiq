"use client";

import { useActionState, useState } from "react";
import { createPost, type FormState } from "@/app/(app)/groups/actions";

export default function ShareForm({ day, itemId, groups, draft }: { day: number; itemId: string; groups: { id: string; name: string }[]; draft: string }) {
  const [groupId, setGroupId] = useState(groups[0].id);
  const [state, action, pending] = useActionState<FormState, FormData>(
    (prev: FormState, form: FormData) => createPost(groupId, day, prev, form),
    {},
  );
  return (
    <form action={action} className="card">
      <input type="hidden" name="redirect" value="1" />
      <input type="hidden" name="item" value={itemId} />
      {groups.length > 1 && (
        <div className="field">
          <label htmlFor="share-group">Group</label>
          <select id="share-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}
      {groups.length === 1 && <p className="small muted">Sharing with <strong>{groups[0].name}</strong>.</p>}
      <div className="field">
        <label htmlFor="share-body">Your post</label>
        <textarea id="share-body" name="body" defaultValue={draft} rows={10} maxLength={10000} required />
      </div>
      {state.error && <p className="error">{state.error}</p>}
      <button className="btn" disabled={pending}>Share with the group</button>
    </form>
  );
}
