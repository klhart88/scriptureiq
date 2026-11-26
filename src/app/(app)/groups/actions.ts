"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseDayParam } from "@/lib/plan";

export type FormState = { error?: string; notice?: string };

async function member() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, userId: data.user.id };
}

export async function createGroup(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Give the group a name." };
  if (name.length > 80) return { error: "Keep the name under 80 characters." };
  const { supabase, userId } = await member();
  const { data, error } = await supabase.from("groups").insert({ name, owner_id: userId }).select("id").single();
  if (error || !data) return { error: error?.message ?? "Could not create the group." };
  redirect(`/groups/${data.id}?created=1`);
}

export async function joinGroup(token: string) {
  const { supabase } = await member();
  const { data, error } = await supabase.rpc("join_group", { p_token: token });
  if (error || !data) redirect(`/join/${token}?error=1`);
  redirect(`/groups/${data}`);
}

export async function renameGroup(groupId: string, _: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { error: "Use 2–80 characters." };
  const { supabase } = await member();
  const { data, error } = await supabase.from("groups").update({ name }).eq("id", groupId).select("id");
  if (error || !data?.length) return { error: error?.message ?? "Only the owner can rename the group." };
  revalidatePath(`/groups/${groupId}`);
  return { notice: "Renamed." };
}

export async function regenerateInvite(groupId: string) {
  const { supabase } = await member();
  await supabase.rpc("regenerate_invite", { p_group: groupId });
  revalidatePath(`/groups/${groupId}`);
}

export async function removeMember(groupId: string, userId: string) {
  const { supabase } = await member();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const { supabase, userId } = await member();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  revalidatePath("/groups");
  redirect("/groups?left=1");
}

export async function deleteGroup(groupId: string) {
  const { supabase } = await member();
  await supabase.from("groups").delete().eq("id", groupId);
  revalidatePath("/groups");
  redirect("/groups?deleted=1");
}

export async function createPost(groupId: string, day: number, _: FormState, form: FormData): Promise<FormState> {
  const body = String(form.get("body") ?? "").trim();
  if (!parseDayParam(String(day))) return { error: "Unknown day." };
  if (!body) return { error: "Write something first." };
  if (body.length > 10000) return { error: "Keep posts under 10,000 characters." };
  const { supabase, userId } = await member();
  const { error } = await supabase.from("posts").insert({ group_id: groupId, day, author_id: userId, body });
  if (error) return { error: /row-level security/i.test(error.message) ? "You're no longer a member of this group." : error.message };
  revalidatePath(`/groups/${groupId}/day/${day}`);
  revalidatePath(`/groups/${groupId}`);
  if (form.get("redirect")) redirect(`/groups/${groupId}/day/${day}?shared=1`);
  return { notice: "Posted." };
}

export async function updatePost(postId: string, groupId: string, day: number, body: string) {
  const text = body.trim();
  if (!text || text.length > 10000) return { error: "Posts must be 1–10,000 characters." };
  const { supabase } = await member();
  const { data, error } = await supabase.from("posts").update({ body: text }).eq("id", postId).select("id");
  if (error || !data?.length) return { error: error?.message ?? "You can only edit your own posts." };
  revalidatePath(`/groups/${groupId}/day/${day}`);
  return { ok: true };
}

export async function deletePost(postId: string, groupId: string, day: number) {
  const { supabase } = await member();
  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath(`/groups/${groupId}/day/${day}`);
  revalidatePath(`/groups/${groupId}`);
}
