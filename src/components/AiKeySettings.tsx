"use client";

import { useState, useSyncExternalStore } from "react";
import { DEFAULT_MODEL, MODELS, testKey } from "@/lib/aggregate-agent";
import { loadAiKey, looksLikeKey, maskKey, saveAiKey, subscribeAiKey } from "@/lib/aiKey";

/** Optional: the member's own Anthropic key for Study Aggregate, kept only on this device. */
export default function AiKeySettings() {
  const ai = useSyncExternalStore(subscribeAiKey, loadAiKey, () => null);
  const [key, setKey] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const chosen = model ?? ai?.model ?? DEFAULT_MODEL;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const k = key.trim() || ai?.key || "";
    if (!looksLikeKey(k)) { setMsg({ error: "That doesn't look like an Anthropic API key (it starts with sk-ant-)." }); return; }
    setBusy(true); setMsg({});
    const r = await testKey(k, chosen);
    setBusy(false);
    if ("error" in r) { setMsg({ error: r.error }); return; }
    saveAiKey({ key: k, model: chosen });
    setKey("");
    setMsg({ ok: "Saved on this device and working." });
  }

  return (
    <form id="aggregate" className="card" onSubmit={save}>
      <h2>Study Aggregate (optional)</h2>
      <p className="muted small">
        Study Aggregate uses Claude with an API key from your own Anthropic account, so you control it and pay Anthropic
        directly (typically a few cents a question). Your key is saved only in this browser and sent only to Anthropic, never
        to ScriptureIQ. Add it on each device you want to use. To get a key, sign in at console.anthropic.com, create an API
        key, and set a monthly spending limit there.
      </p>
      {ai && <p className="small">Key on this device: <code>{maskKey(ai.key)}</code></p>}
      <div className="field">
        <label htmlFor="ai_key">{ai ? "Replace key" : "Anthropic API key"}</label>
        <input id="ai_key" type="password" autoComplete="off" spellCheck={false} placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="ai_model">Model</label>
        <select id="ai_model" value={chosen} onChange={(e) => setModel(e.target.value)}>
          {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>
      {msg.error && <p className="error">{msg.error}</p>}
      {msg.ok && <p className="notice">{msg.ok}</p>}
      <div className="row">
        <button className="btn" disabled={busy || (!key.trim() && !ai)}>{busy ? "Checking…" : ai ? "Save" : "Save and test"}</button>
        {ai && (
          <button type="button" className="btn ghost" onClick={() => { if (confirm("Remove your Anthropic key from this device?")) { saveAiKey(null); setMsg({ ok: "Removed from this device." }); } }}>
            Remove key
          </button>
        )}
      </div>
    </form>
  );
}
