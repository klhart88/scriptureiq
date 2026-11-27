import Nav from "@/components/Nav";
import TopBar from "@/components/TopBar";
import { requireMember } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireMember();
  return (
    <>
      <TopBar />
      <main className="shell">{children}</main>
      <Nav />
    </>
  );
}
