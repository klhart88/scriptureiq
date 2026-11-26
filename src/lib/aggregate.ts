import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Overview } from "./aggregate-agent";

/** Below this many answered reflections, the page warns that answers will be thin. */
export const FEW_NOTES = 10;

export async function notesOverview(supabase: SupabaseClient): Promise<Overview> {
  const { data } = await supabase.rpc("my_notes_overview");
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? { answered: 0, days: 0, first_day: null, last_day: null, books: "" };
}
