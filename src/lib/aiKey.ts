/** The member's own Anthropic key and model choice, saved only in this browser (never sent to ScriptureIQ). */
import { DEFAULT_MODEL } from "./aggregate-agent";

export type AiKey = { key: string; model: string };
const STORE = "siq.anthropic";
const EVENT = "siq-anthropic-change";
let cache: AiKey | null | undefined;

export function loadAiKey(): AiKey | null {
  if (cache !== undefined) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "null");
    cache = v && typeof v.key === "string" && v.key ? { key: v.key, model: v.model || DEFAULT_MODEL } : null;
  } catch { cache = null; }
  return cache;
}

export function saveAiKey(v: AiKey | null) {
  try { if (v) localStorage.setItem(STORE, JSON.stringify(v)); else localStorage.removeItem(STORE); } catch {}
  cache = undefined;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeAiKey(cb: () => void) {
  const on = () => { cache = undefined; cb(); };
  window.addEventListener(EVENT, on);
  window.addEventListener("storage", on);
  return () => { window.removeEventListener(EVENT, on); window.removeEventListener("storage", on); };
}

export function maskKey(key: string) {
  return key.length > 14 ? `${key.slice(0, 7)}…${key.slice(-4)}` : "••••";
}

export function looksLikeKey(key: string) {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}
