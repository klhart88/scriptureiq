import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregateModel, anthropicKey } from "./supabase/env";
import { citedDays } from "./aggregate-cite";

/** Most questions a member can ask in one day (keeps API cost predictable). */
export const DAILY_LIMIT = 25;
/** Below this many answered reflections, the page warns that answers will be thin. */
export const FEW_NOTES = 10;

export type Overview = { answered: number; days: number; first_day: number | null; last_day: number | null; books: string };

export async function notesOverview(supabase: SupabaseClient): Promise<Overview> {
  const { data } = await supabase.rpc("my_notes_overview");
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? { answered: 0, days: 0, first_day: null, last_day: null, books: "" };
}

const TOOLS: Anthropic.Tool[] = [
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

type NoteRow = { day: number; reading: string; kind: string; question: string; answer: string };

function format(rows: NoteRow[]) {
  if (!rows.length) return "No matching notes.";
  return rows
    .map((r) => `[Day ${r.day}] ${r.reading}${r.kind === "own" ? " (member's own question)" : ""}\nQ: ${r.question}\nA: ${r.answer}`)
    .join("\n\n");
}

async function runTool(supabase: SupabaseClient, name: string, input: Record<string, unknown>, seen: Set<number>) {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);
  if (name === "search_notes") {
    const { data, error } = await supabase.rpc("search_my_notes", {
      p_query: str(input.query), p_book: str(input.book), p_from: num(input.from_day), p_to: num(input.to_day), p_limit: 12,
    });
    if (error) return `Search failed: ${error.message}`;
    (data ?? []).forEach((r: NoteRow) => seen.add(r.day));
    return format((data ?? []) as NoteRow[]);
  }
  if (name === "get_day_notes") {
    const day = num(input.day);
    if (!day) return "Give a day number.";
    const { data, error } = await supabase.rpc("search_my_notes", { p_query: null, p_book: null, p_from: day, p_to: day, p_limit: 25 });
    if (error) return `Lookup failed: ${error.message}`;
    (data ?? []).forEach((r: NoteRow) => seen.add(r.day));
    return format((data ?? []) as NoteRow[]);
  }
  return "Unknown tool.";
}

function system(name: string, o: Overview) {
  return `You are Study Aggregate in ScriptureIQ, a companion to BibleProject's reading plan "One Story That Leads to Jesus" (358 days, NIV).
You help ${name || "the member"} look back over their OWN reflection notes. Use the tools to search their notes; they hold nothing else.

What they have written so far: ${o.answered} answered reflections across ${o.days} plan days${o.first_day ? ` (Days ${o.first_day}-${o.last_day}; ${o.books})` : ""}.

How to answer:
- Write in the member's own voice, first person ("I've noticed...", "What stands out to me..."), as a synthesis of what THEY wrote. Keep their wording, convictions and tone; don't add beliefs, doctrine or conclusions they haven't expressed.
- Base every point on their notes and cite the day in square brackets right after it, like [Day 12]. Only cite days you actually read.
- If the notes don't cover the question, or there are only a few notes, say so plainly in one or two sentences, share what little is there, and suggest which kinds of reflections would help. Never fill gaps with outside teaching.
- Don't quote more than a sentence of Bible text. Keep it under 250 words, in short plain paragraphs (no headings, no bullet lists, no markdown).`;
}

export type AskResult = { answer: string; cited: number[] } | { error: string };

/** Answers a question by letting Claude search the member's notes (row-level security limits it to their own). */
export async function askAggregate(supabase: SupabaseClient, question: string, name: string, o: Overview): Promise<AskResult> {
  const key = anthropicKey();
  if (!key) return { error: "Study Aggregate isn't switched on yet." };
  const client = new Anthropic({ apiKey: key });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  const seen = new Set<number>(); // days whose notes Claude actually read
  try {
    for (let turn = 0; turn < 6; turn++) {
      const res = await client.messages.create({
        model: aggregateModel(),
        max_tokens: 1200,
        system: system(name, o),
        tools: TOOLS,
        tool_choice: turn === 5 ? { type: "none" } : { type: "auto" },
        messages,
      });
      const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || !uses.length) {
        const raw = res.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        // Keep only citations of days Claude actually read, so every link points to real notes.
        const answer = raw.replace(/ ?\[Day (\d{1,3})\]/g, (m, d) => (seen.has(Number(d)) ? m : "")).trim();
        return answer ? { answer, cited: citedDays(answer) } : { error: "No answer came back. Please try again." };
      }
      messages.push({ role: "assistant", content: res.content as unknown as Anthropic.ContentBlockParam[] });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const u of uses) {
        results.push({ type: "tool_result", tool_use_id: u.id, content: await runTool(supabase, u.name, (u.input ?? {}) as Record<string, unknown>, seen) });
      }
      messages.push({ role: "user", content: results });
    }
    return { error: "That question took too many steps. Try asking something narrower." };
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 401) return { error: "Study Aggregate's API key isn't valid. The app owner needs to update it." };
    if (status === 429 || status === 529) return { error: "Claude is busy right now. Please try again in a minute." };
    return { error: "Something went wrong while reading your notes. Please try again." };
  }
}

/** Questions this member asked in the last 24 hours (for the daily limit). */
export async function asksInLastDay(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase.from("aggregate_asks").select("id", { count: "exact", head: true }).gte("created_at", since);
  return count ?? 0;
}
