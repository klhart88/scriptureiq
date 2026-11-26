import Link from "next/link";
import PasswordForm from "@/components/PasswordForm";
import { requireMember } from "@/lib/data";

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const reset = Boolean((await searchParams).reset);
  const { user } = await requireMember();
  return (
    <article>
      <div className="eyebrow"><Link href="/settings">Settings</Link></div>
      <h1>{reset ? "Choose a new password" : "Change password"}</h1>
      <p className="muted small">For {user.email}. Use a password you don&rsquo;t use anywhere else.</p>
      <PasswordForm />
    </article>
  );
}
