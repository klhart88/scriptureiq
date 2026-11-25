"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { dateForDay, dayForDate, formatDate, TOTAL_DAYS } from "@/lib/plan";

type Group = { section: string; days: number[] };

export default function CalendarGrid({ startDate, completed, groups }: { startDate: string | null; completed: number[]; groups: Group[] }) {
  // Today's plan day comes from the device's local date, so it is worked out in the browser.
  const today = useSyncExternalStore(() => () => {}, () => (startDate ? dayForDate(startDate, new Date()) : null), () => null);
  const done = new Set(completed);
  const missed = today ? Array.from({ length: today - 1 }, (_, i) => i + 1).filter((d) => !done.has(d)) : [];

  return (
    <>
      <div className="card">
        <div className="spread">
          <div>
            <div className="eyebrow">Progress</div>
            <strong>{done.size} of {TOTAL_DAYS} days complete</strong>
          </div>
          {today && <Link className="btn" href={`/day/${today}`}>Today · Day {today}</Link>}
        </div>
        {missed.length > 0 && (
          <p className="small" style={{ marginTop: ".75rem", marginBottom: 0 }}>
            Catch up: {missed.slice(0, 8).map((d, i) => <span key={d}>{i > 0 && ", "}<Link href={`/day/${d}`}>Day {d}</Link></span>)}
            {missed.length > 8 && <> and {missed.length - 8} more</>}
          </p>
        )}
      </div>
      {groups.map((g) => (
        <section key={g.section} className="card">
          <h2>{g.section}</h2>
          <div className="grid">
            {g.days.map((d) => (
              <Link key={d} href={`/day/${d}`}
                className={[done.has(d) ? "done" : "", d === today ? "today" : "", missed.includes(d) ? "missed" : ""].join(" ")}
                title={startDate ? formatDate(dateForDay(startDate, d)) : undefined}>
                {d}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
