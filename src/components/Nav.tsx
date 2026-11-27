"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Simple line icons (24×24, drawn with the current text colour).
const ICONS: Record<string, React.ReactNode> = {
  today: <><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /><path d="M3 6v13" /><path d="M12 6v13" /><path d="M21 6v13" /></>,
  notes: <><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-11a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1" /><path d="M9 4v16" /><path d="M12 8h4" /><path d="M12 12h4" /></>,
  discuss: <><path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" /><path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" /></>,
  aggregate: <><path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" /><path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" /><path d="M9.7 17l4.6 0" /></>,
  calendar: <><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></>,
  settings: <><path d="M10.3 4.3c.4 -1.8 3 -1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5 -.9 3.3 .8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8 .4 1.8 3 0 3.4a1.7 1.7 0 0 0 -1 2.6c.9 1.5 -.8 3.3 -2.4 2.4a1.7 1.7 0 0 0 -2.6 1c-.4 1.8 -3 1.8 -3.4 0a1.7 1.7 0 0 0 -2.6 -1c-1.5 .9 -3.3 -.8 -2.4 -2.4a1.7 1.7 0 0 0 -1 -2.6c-1.8 -.4 -1.8 -3 0 -3.4a1.7 1.7 0 0 0 1 -2.6c-.9 -1.5 .8 -3.3 2.4 -2.4c1 .6 2.3 .1 2.6 -1z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></>,
};

// Short labels fit six pills on a phone; wider screens show the full names.
const ITEMS = [
  { href: "/today", icon: "today", short: "Today", full: "Today", match: ["/today", "/day"] },
  { href: "/notes", icon: "notes", short: "Notes", full: "Study Notes", match: ["/notes"] },
  { href: "/groups", icon: "discuss", short: "Discuss", full: "Discuss It", match: ["/groups", "/join"] },
  { href: "/aggregate", icon: "aggregate", short: "Aggregate", full: "Aggregate", match: ["/aggregate"] },
  { href: "/calendar", icon: "calendar", short: "Calendar", full: "Calendar", match: ["/calendar"] },
  { href: "/settings", icon: "settings", short: "Settings", full: "Settings", match: ["/settings"] },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.match.some((m) => path.startsWith(m)) ? "page" : undefined} aria-label={i.full}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {ICONS[i.icon]}
          </svg>
          <span className="lbl-short">{i.short}</span>
          <span className="lbl-full">{i.full}</span>
        </Link>
      ))}
    </nav>
  );
}
