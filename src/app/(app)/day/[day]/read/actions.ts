"use server";

import { createClient } from "@/lib/supabase/server";
import { parseDayParam } from "@/lib/plan";

export type SegmentProgress = Record<string, { done: number; total: number }>;

export async function saveProgress(day: number, segments: SegmentProgress, position: { segment: number; block: number } | null, complete: boolean) {
  if (!parseDayParam(String(day))) return { error: "bad day" };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "signed out" };
  const { data: existing } = await supabase.from("day_progress").select("completed_at").eq("day", day).maybeSingle();
  const { error } = await supabase.from("day_progress").upsert({
    user_id: auth.user.id,
    day,
    segments,
    position,
    completed_at: existing?.completed_at ?? (complete ? new Date().toISOString() : null),
  });
  return error ? { error: error.message } : { ok: true };
}
