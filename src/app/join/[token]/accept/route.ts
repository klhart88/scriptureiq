import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Accepts an invite. A plain form POST (not a client-side action), so it works even if the page was
 * loaded before a sign-in or a new deployment.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
  if (!/^[a-f0-9]{16,64}$/i.test(token)) return to("/groups");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return to(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  const { data, error } = await supabase.rpc("join_group", { p_token: token });
  if (error || !data) return to(`/join/${token}?error=1`);
  return to(`/groups/${data}?joined=1`);
}

/** Visiting this address directly (for example after signing in) goes back to the invite page. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return NextResponse.redirect(new URL(`/join/${encodeURIComponent(token)}`, request.url), 303);
}
