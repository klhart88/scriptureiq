"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The small ScriptureIQ bar at the top of every screen; tapping it returns to the landing page (which has its own large brand). */
export default function TopBar() {
  if (usePathname() === "/home") return null;
  return (
    <header className="topbar">
      <Link href="/home" className="brand">ScriptureIQ</Link>
    </header>
  );
}
