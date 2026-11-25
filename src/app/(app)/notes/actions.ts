"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function client() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Signed out");
  return { supabase, userId: data.user.id };
}

async function touchEntry(supabase: Awaited<ReturnType<typeof client>>["supabase"], entryId: string) {
  await supabase.from("note_entries").update({ updated_at: new Date().toISOString() }).eq("id", entryId);
}

export async function saveAnswer(itemId: string, entryId: string, answer: string) {
  const { supabase } = await client();
  const { error } = await supabase.from("note_items").update({ answer }).eq("id", itemId);
  if (!error) await touchEntry(supabase, entryId);
  return error ? { error: error.message } : { ok: true, at: new Date().toISOString() };
}

export async function addQuestion(entryId: string, day: number, question: string) {
  const q = question.trim();
  if (!q) return { error: "Write a question first." };
  const { supabase, userId } = await client();
  const { data: last } = await supabase.from("note_items").select("position").eq("entry_id", entryId)
    .order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("note_items").insert({
    entry_id: entryId, user_id: userId, kind: "own", question: q, position: (last?.position ?? -1) + 1,
  });
  if (error) return { error: error.message };
  await touchEntry(supabase, entryId);
  revalidatePath(`/notes/${day}`);
  return { ok: true };
}

export async function deleteItem(itemId: string, day: number) {
  const { supabase } = await client();
  const { error } = await supabase.from("note_items").delete().eq("id", itemId);
  revalidatePath(`/notes/${day}`);
  return error ? { error: error.message } : { ok: true };
}

/** Saves a new order for the entry's questions. */
export async function reorderItems(entryId: string, day: number, orderedIds: string[]) {
  const { supabase } = await client();
  for (const [position, id] of orderedIds.entries()) {
    const { error } = await supabase.from("note_items").update({ position }).eq("id", id).eq("entry_id", entryId);
    if (error) return { error: error.message };
  }
  revalidatePath(`/notes/${day}`);
  return { ok: true };
}
