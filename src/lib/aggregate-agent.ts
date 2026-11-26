/**
 * Study Aggregate's ask-and-answer loop. Runs in the member's browser with THEIR Anthropic key:
 * the key goes only from this device to Anthropic. Note searches go through ScriptureIQ's server,
 * which row-level security limits to the member's own notes.
 */

export const MODELS = [
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (recommended)" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (lower cost)" },
];
export const DEFAULT_MODEL = MODELS[0].id;

export type Overview = { answered: number; days: number; first_day: number | null; last_day: number | null; books: string };
export type ToolResult = { text: string; days: number[] };
export type CallTool = (name: string, input: Record<string, unknown>) => Promise<ToolResult>;
export type AgentResult = { answer: string; cited: number[] } | { error: string };

const API = "https://api.anthropic.com/v1/messages";

export const TOOLS = [
  {
    name: "search_notes",
    description:
      "Search the member's own answered reflection notes. Any word may match; best matches first. Leave query empty to get the most recent answers. Search several times with different words (synonyms, names, themes) before concluding the notes don't cover something.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to look for, e.g. 'mercy forgiveness Cain'" },
        book: { type: "string", description: "Optional Bible book to limit to, e.g. 'Genesis'" },
        from_day: { type: "integer", description: "Optional first plan day (1-358)" },
        to_day: { type: "integer", description: "Optional last plan day (1-358)" },
      },
    },
  },
  {
    name: "get_day_notes",
    description: "Get every answered note the member wrote for one plan day, with that day's reading.",
    input_schema: { type: "object", properties: { day: { type: "integer" } }, required: ["day"] },
  },
];

export function buildSystem(name: string, o: Overview) {
  return `You are Study Aggregate in ScriptureIQ, a companion to BibleProject's reading plan "One Story That Leads to Jesus" (358 days, NIV).
You help ${name || "the member"} look back over their OWN reflection notes. Use the tools to search their notes; they hold nothing else.

What they have written so far: ${o.answered} answered reflections across ${o.days} plan days${o.first_day ? ` (Days ${o.first_day}-${o.last_day}; ${o.books})` : ""}.

How to answer:
- Write in the member's own voice, first person ("I've noticed...", "What stands out to me..."), as a synthesis of what THEY wrote. Keep their wording, convictions and tone; don't add beliefs, doctrine or conclusions they haven't expressed.
- Base every point on their notes and cite the day in square brackets right after it, like [Day 12]. Only cite days you actually read.
- If the notes don't cover the question, or there are only a few notes, say so plainly in one or two sentences, share what little is there, and suggest which kinds of reflections would help. Never fill gaps with outside teaching.
- Don't quote more than a sentence of Bible text. Keep it under 250 words, in short plain paragraphs (no headings, no bullet lists, no markdown).`;
}

function headers(key: string) {
  return {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    // Required for calls made directly from a browser; the key belongs to the person using this device.
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

/** Turns an Anthropic error response into a plain message for the member. */
export async function explainError(res: Response): Promise<string> {
  let msg = "";
  try { msg = ((await res.json()) as { error?: { message?: string } }).error?.message ?? ""; } catch {}
  if (res.status === 401 || res.status === 403) return "Anthropic didn't accept this API key. Check it in Settings.";
  if (/credit balance/i.test(msg)) return "Your Anthropic account is out of credits. Add credits in the Anthropic Console, then try again.";
  if (res.status === 404) return "That Claude model isn't available to your account. Choose another model in Settings.";
  if (res.status === 429) return "Your Anthropic account hit a rate or spending limit. Wait a minute or check your limits in the Anthropic Console.";
  if (res.status >= 500) return "Claude is busy right now. Please try again in a minute.";
  return msg ? `Anthropic: ${msg}` : `Anthropic returned an error (${res.status}).`;
}

type Block = { type: string; text?: string; id?: string; name?: string; input?: unknown };

export async function runAgent(opts: {
  question: string; key: string; model: string; system: string; callTool: CallTool; fetchImpl?: typeof fetch; maxTurns?: number;
}): Promise<AgentResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  const maxTurns = opts.maxTurns ?? 6;
  const messages: { role: "user" | "assistant"; content: unknown }[] = [{ role: "user", content: opts.question }];
  const seen = new Set<number>(); // days whose notes Claude actually read
  for (let turn = 0; turn < maxTurns; turn++) {
    let res: Response;
    try {
      res = await doFetch(API, {
        method: "POST",
        headers: headers(opts.key),
        body: JSON.stringify({
          model: opts.model, max_tokens: 1200, system: opts.system, tools: TOOLS,
          tool_choice: { type: turn === maxTurns - 1 ? "none" : "auto" }, messages,
        }),
      });
    } catch {
      return { error: "Couldn't reach Anthropic. Check your connection and try again." };
    }
    if (!res.ok) return { error: await explainError(res) };
    const data = (await res.json()) as { content: Block[]; stop_reason: string };
    const uses = data.content.filter((b) => b.type === "tool_use");
    if (data.stop_reason !== "tool_use" || !uses.length) {
      const raw = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      // Keep only citations of days Claude actually read, so every link points to real notes.
      const answer = raw.replace(/ ?\[Day (\d{1,3})\]/g, (m, d) => (seen.has(Number(d)) ? m : "")).trim();
      return answer ? { answer, cited: citedDays(answer) } : { error: "No answer came back. Please try again." };
    }
    messages.push({ role: "assistant", content: data.content });
    const results = [];
    for (const u of uses) {
      let out: ToolResult;
      try { out = await opts.callTool(u.name ?? "", (u.input ?? {}) as Record<string, unknown>); }
      catch { out = { text: "The note search failed.", days: [] }; }
      out.days.forEach((d) => seen.add(d));
      results.push({ type: "tool_result", tool_use_id: u.id, content: out.text });
    }
    messages.push({ role: "user", content: results });
  }
  return { error: "That question took too many steps. Try asking something narrower." };
}

/** Checks a key with a one-word request (costs a tiny fraction of a cent). */
export async function testKey(key: string, model: string, fetchImpl: typeof fetch = fetch): Promise<{ ok: true } | { error: string }> {
  try {
    const res = await fetchImpl(API, {
      method: "POST", headers: headers(key),
      body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "Hi" }] }),
    });
    return res.ok ? { ok: true } : { error: await explainError(res) };
  } catch {
    return { error: "Couldn't reach Anthropic. Check your connection and try again." };
  }
}

/** Days cited as [Day 12] in a Study Aggregate answer, in order, without repeats. */
export function citedDays(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\[Day (\d{1,3})\]/g)) {
    const d = Number(m[1]);
    if (d >= 1 && d <= 358 && !out.includes(d)) out.push(d);
  }
  return out;
}

/** Splits an answer into text and day links, for rendering "[Day 12]" as a link to that day's notes. */
export function answerParts(text: string): ({ text: string } | { day: number })[] {
  const parts: ({ text: string } | { day: number })[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[Day (\d{1,3})\]/g)) {
    const d = Number(m[1]);
    if (d < 1 || d > 358) continue;
    if (m.index! > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ day: d });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
