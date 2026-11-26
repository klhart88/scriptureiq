"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPost, type FormState } from "@/app/(app)/groups/actions";

export default function PostComposer({ groupId, day }: { groupId: string; day: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPost.bind(null, groupId, day), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.notice) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="card composer">
      <label htmlFor="post-body">Add to the conversation</label>
      <textarea id="post-body" name="body" rows={4} maxLength={10000} placeholder="Share a thought, a question, or what stood out to you…" required />
      {state.error && <p className="error small">{state.error}</p>}
      <div className="spread" style={{ marginTop: ".5rem" }}>
        <span className="small muted">Seen only by members of this group.</span>
        <button className="btn" disabled={pending}>Post</button>
      </div>
    </form>
  );
}
