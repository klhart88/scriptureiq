import Link from "next/link";
import Nav from "@/components/Nav";
import { requireMember } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireMember();
  return (
    <>
      <header className="topbar">
        <Link href="/today" className="brand">ScriptureIQ</Link>
      </header>
      <main className="shell">{children}</main>
      <Nav />
    </>
  );
}
