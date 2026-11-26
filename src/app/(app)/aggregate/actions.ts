"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ToolResult } from "@/lib/aggregate-agent";

type NoteRow = { day: number; reading: string; kind: string; question: string; answer: string };

/**
 * Note lookups for Study Aggregate. Runs as the signed-in member, so row-level security returns only
 * their own notes. (No API key ever reaches this server: Claude is called from the member's device.)
 */
export async function noteTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { text: "Not signed in.", days: [] };
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);
  let args;
  if (name === "search_notes") {
    args = { p_query: str(input.query), p_book: str(input.book), p_from: num(input.from_day), p_to: num(input.to_day), p_limit: 12 };
  } else if (name === "get_day_notes") {
    const day = num(input.day);
    if (!day) return { text: "Give a day number.", days: [] };
    args = { p_query: null, p_book: null, p_from: day, p_to: day, p_limit: 25 };
  } else {
    return { text: "Unknown tool.", days: [] };
  }
  const { data, error } = await supabase.rpc("search_my_notes", args);
  if (error) return { text: "The note search failed.", days: [] };
  const rows = (data ?? []) as NoteRow[];
  if (!rows.length) return { text: "No matching notes.", days: [] };
  return {
    text: rows
      .map((r) => `[Day ${r.day}] ${r.reading}${r.kind === "own" ? " (member's own question)" : ""}\nQ: ${r.question}\nA: ${r.answer}`)
      .join("\n\n"),
    days: [...new Set(rows.map((r) => r.day))],
  };
}

export async function saveAsk(question: string, answer: string, cited: number[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };
  const q = question.trim().slice(0, 500);
  const days = cited.filter((d) => Number.isInteger(d) && d >= 1 && d <= 358).slice(0, 60);
  const { error } = await supabase.from("aggregate_asks").insert({ question: q, answer: answer.slice(0, 8000), cited_days: days });
  if (error) return { error: "Your answer couldn't be saved." };
  revalidatePath("/aggregate");
  return {};
}

export async function deleteAsk(id: string) {
  const supabase = await createClient();
  await supabase.from("aggregate_asks").delete().eq("id", id);
  revalidatePath("/aggregate");
}
