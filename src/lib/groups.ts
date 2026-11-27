import "server-only";
import type { createClient } from "./supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

export type Group = { id: string; name: string; owner_id: string; invite_token: string; created_at: string };
export type Post = { id: string; group_id: string; day: number; author_id: string; body: string; created_at: string; updated_at: string };

/** Groups the member belongs to (row-level security returns only those). */
export async function myGroups(supabase: Supa) {
  const { data } = await supabase.from("groups").select("id, name, owner_id, invite_token, created_at").order("created_at");
  return (data ?? []) as Group[];
}

export async function memberNames(supabase: Supa, groupId: string) {
  const { data } = await supabase.rpc("group_member_names", { p_group: groupId });
  return new Map(((data ?? []) as { user_id: string; display_name: string }[]).map((m) => [m.user_id, m.display_name || "Member"]));
}

export function inviteUrl(origin: string, token: string) {
  return `${origin.replace(/\/+$/, "")}/join/${token}`;
}

export { timeAgo } from "./time";
