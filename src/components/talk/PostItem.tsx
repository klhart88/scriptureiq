"use client";

import { useState, useTransition } from "react";
import { deletePost, updatePost } from "@/app/(app)/groups/actions";

export default function PostItem({ id, groupId, day, author, when, edited, body, canEdit, canDelete }: {
  id: string; groupId: string; day: number; author: string; when: string; edited: boolean; body: string; canEdit: boolean; canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(body);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const save = () => start(async () => {
    const res = await updatePost(id, groupId, day, text);
    if ("error" in res && res.error) setError(res.error); else { setError(""); setEditing(false); }
  });
  const remove = () => {
    if (!confirm("Delete this post?")) return;
    start(async () => { await deletePost(id, groupId, day); });
  };

  return (
    <li className="post">
      <div className="spread">
        <span><strong>{author}</strong> <span className="small muted">· {when}{edited ? " · edited" : ""}</span></span>
        {(canEdit || canDelete) && !editing && (
          <span className="row">
            {canEdit && <button className="btn ghost small" onClick={() => setEditing(true)} disabled={pending}>Edit</button>}
            {canDelete && <button className="btn ghost small" onClick={remove} disabled={pending}>Delete</button>}
          </span>
        )}
      </div>
      {editing ? (
        <div style={{ marginTop: ".4rem" }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={10000} aria-label="Edit post" />
          {error && <p className="error small">{error}</p>}
          <div className="row" style={{ marginTop: ".4rem" }}>
            <button className="btn" onClick={save} disabled={pending || !text.trim()}>Save</button>
            <button className="btn ghost" onClick={() => { setEditing(false); setText(body); setError(""); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <p className="postbody">{body}</p>
      )}
    </li>
  );
}
