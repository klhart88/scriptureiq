"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; notice?: string };

export async function saveSettings(_: SettingsState, form: FormData): Promise<SettingsState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const display_name = String(form.get("display_name") ?? "").trim();
  const start_date = String(form.get("start_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) return { error: "Choose a start date." };
  const { error } = await supabase.from("profiles").update({ display_name, start_date }).eq("id", data.user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  if (form.get("welcome")) redirect("/today");
  return { notice: "Saved." };
}
