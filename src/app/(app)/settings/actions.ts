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
  // Upsert, so a member whose profile row is missing (e.g. created before the schema existed) still saves.
  const { data: saved, error } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, display_name, start_date }, { onConflict: "id" })
    .select("id");
  if (error) return { error: error.message };
  if (!saved?.length) return { error: "Your settings could not be saved. Please try again." };
  revalidatePath("/", "layout");
  if (form.get("welcome")) redirect("/today");
  return { notice: "Saved." };
}
