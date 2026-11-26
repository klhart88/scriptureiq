"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";

export type AuthState = { error?: string; notice?: string };

function safeNext(raw: FormDataEntryValue | null) {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/today";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: error.message };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const origin = siteUrl() || ((await headers()).get("origin") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email") ?? "").trim(),
    password,
    options: {
      data: { display_name: String(form.get("name") ?? "").trim() },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeNext(form.get("next")))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/settings?welcome=1");
  return { notice: "Check your email to confirm your account, then sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Sends a password-reset email. Always reports success, so the form can't be used to test which emails have accounts. */
export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email you signed up with." };
  const supabase = await createClient();
  const origin = siteUrl() || ((await headers()).get("origin") ?? "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/settings/password?reset=1")}`,
  });
  if (error && /rate limit/i.test(error.message)) return { error: "Too many emails sent. Please wait a few minutes and try again." };
  return { notice: "If that email has an account, a reset link is on its way. Open it on this device." };
}
