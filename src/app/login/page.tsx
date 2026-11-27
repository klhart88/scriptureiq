import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string; deleted?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="shell" style={{ maxWidth: 420, paddingTop: "3rem" }}>
      <h1>ScriptureIQ</h1>
      <p className="muted">A companion for <em>One Story That Leads to Jesus</em>.</p>
      {sp.deleted && <p className="notice">Your account and everything in it have been deleted.</p>}
      {sp.error && <p className="error">That link has expired or was already used. Please sign in.</p>}
      <LoginForm next={sp.next ?? "/today"} initialMode={sp.mode === "signup" ? "signup" : "signin"} />
    </main>
  );
}
