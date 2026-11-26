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

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
