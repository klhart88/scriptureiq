"use server";

import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string; notice?: string };

export async function changePassword(_: PasswordState, form: FormData): Promise<PasswordState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in again." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/different from the old/i.test(error.message)) return { error: "Choose a password different from your current one." };
    if (/reauthenticat|recent/i.test(error.message)) return { error: "For security, sign out and sign in again, then change your password." };
    return { error: error.message };
  }
  return { notice: "Your password has been changed." };
}
