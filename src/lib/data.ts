import "server-only";
import { redirect, notFound } from "next/navigation";
import { getUser } from "./supabase/server";
import type { PlanDay } from "./plan";

/** Signed-in user and profile. Sends signed-out visitors to /login. */
export async function requireMember() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, start_date").eq("id", user.id).single();
  return { supabase, user, profile: profile ?? { display_name: "", start_date: null as string | null } };
}

export async function getPlanDay(supabase: Awaited<ReturnType<typeof requireMember>>["supabase"], day: number) {
  const { data } = await supabase.from("plan_days").select("*").eq("day", day).single();
  if (!data) notFound();
  return data as PlanDay;
}
