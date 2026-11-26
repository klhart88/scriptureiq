"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/today", label: "Today", match: ["/today", "/day"] },
  { href: "/notes", label: "Study Notes", match: ["/notes"] },
  { href: "/groups", label: "Talk It Over", match: ["/groups", "/join"] },
  { href: "/aggregate", label: "Aggregate", match: ["/aggregate"] },
  { href: "/calendar", label: "Calendar", match: ["/calendar"] },
  { href: "/settings", label: "Settings", match: ["/settings"] },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.match.some((m) => path.startsWith(m)) ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
