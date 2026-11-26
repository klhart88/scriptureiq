/**
 * Supabase settings, read on the server only. Accepts the plain names (preferred) or the older
 * NEXT_PUBLIC_ names. Refuses a secret / service-role key: that key bypasses row-level security,
 * which would let one member read another's notes.
 */
export type SupabaseEnv = { url: string; key: string };

// Each name is written out in full: the proxy can only see settings referenced directly.
function first(...values: (string | undefined)[]) {
  for (const raw of values) {
    const v = raw?.trim().replace(/^["']|["']$/g, "");
    if (v) return v;
  }
  return "";
}

function isSecretKey(key: string) {
  if (key.startsWith("sb_secret_")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

export function supabaseEnv(): SupabaseEnv | { error: string } {
  const url = first(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
  const key = first(
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (!url) return { error: "SUPABASE_URL is not set." };
  if (!/^https?:\/\//.test(url)) return { error: "SUPABASE_URL must start with https://" };
  if (!key) return { error: "SUPABASE_PUBLISHABLE_KEY is not set." };
  if (isSecretKey(key)) {
    return { error: "SUPABASE_PUBLISHABLE_KEY holds a secret (service_role) key. Use the publishable or anon public key instead." };
  }
  return { url, key };
}

export function requireSupabaseEnv(): SupabaseEnv {
  const env = supabaseEnv();
  if ("error" in env) throw new Error(`ScriptureIQ setup: ${env.error}`);
  return env;
}

export function siteUrl() {
  return first(process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, "");
}

/** Anthropic API key for Study Aggregate (server only). Empty when not set up yet. */
export function anthropicKey() {
  return first(process.env.ANTHROPIC_API_KEY);
}

/** Model for Study Aggregate; can be changed in Vercel without a code change. */
export function aggregateModel() {
  return first(process.env.ANTHROPIC_MODEL) || "claude-sonnet-5-5";
}
