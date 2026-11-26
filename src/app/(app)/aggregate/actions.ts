"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { askAggregate, asksInLastDay, DAILY_LIMIT, notesOverview } from "@/lib/aggregate";

export type AskState = { error?: string; askedAt?: number };

export async function ask(_: AskState, form: FormData): Promise<AskState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const question = String(form.get("question") ?? "").trim();
  if (question.length < 3) return { error: "Type a question first." };
  if (question.length > 500) return { error: "Please keep your question under 500 characters." };

  if ((await asksInLastDay(supabase)) >= DAILY_LIMIT) return { error: `You've reached today's limit of ${DAILY_LIMIT} questions. Try again tomorrow.` };

  const overview = await notesOverview(supabase);
  if (!overview.answered) return { error: "Answer a few reflections in My Study Notes first." };
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", auth.user.id).maybeSingle();

  const result = await askAggregate(supabase, question, profile?.display_name ?? "", overview);
  if ("error" in result) return { error: result.error };
  const { error } = await supabase.from("aggregate_asks").insert({ question, answer: result.answer, cited_days: result.cited });
  if (error) return { error: "Your answer couldn't be saved. Please try again." };
  revalidatePath("/aggregate");
  return { askedAt: Date.now() };
}

export async function deleteAsk(id: string) {
  const supabase = await createClient();
  await supabase.from("aggregate_asks").delete().eq("id", id);
  revalidatePath("/aggregate");
}
