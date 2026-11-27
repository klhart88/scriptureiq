"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { dateForDay, formatDate, rawDayForDate, TOTAL_DAYS } from "@/lib/plan";

const DAYS = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);
const noop = () => () => {};

export default function Landing({ startDate, completed }: { startDate: string; completed: number[] }) {
  // Today's plan day comes from the device's own date (null until the page reaches the browser).
  const raw = useSyncExternalStore(noop, () => rawDayForDate(startDate), () => null);
  const done = new Set(completed);
  const strip = useRef<HTMLDivElement>(null);
  const today = raw === null ? null : Math.min(Math.max(raw, 1), TOTAL_DAYS);

  // Centre today's day in the strip.
  useEffect(() => {
    const el = strip.current;
    const chip = el?.querySelector<HTMLElement>('[data-today="true"]');
    if (el && chip) el.scrollLeft = chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2;
  }, [today]);

  let big: React.ReactNode = <span className="daybtn-num">&nbsp;</span>;
  let href = "/today";
  let sub = "Read today";
  let label = "Open today's reading";
  if (raw !== null && raw < 1) {
    big = <><span className="daybtn-small">Starts</span><span className="daybtn-date">{formatDate(startDate, { month: "short", day: "numeric" })}</span></>;
    href = "/day/1"; sub = "Preview Day 1"; label = "Preview Day 1";
  } else if (raw !== null && raw > TOTAL_DAYS) {
    big = <><span className="daybtn-small">Plan</span><span className="daybtn-date">complete</span></>;
    href = "/calendar"; sub = "See all 358 days"; label = "Plan complete: open the calendar";
  } else if (today !== null) {
    big = <><span className="daybtn-small">Day</span><span className="daybtn-num">{today}</span><span className="daybtn-small">of {TOTAL_DAYS}</span></>;
    href = `/day/${today}`;
    sub = done.has(today) ? "Completed ✓" : "Read today";
    label = `Day ${today} of ${TOTAL_DAYS}: ${sub}`;
  }

  return (
    <div className="landing">
      <div className="landing-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon.svg" alt="" width={32} height={32} />
        <span>ScriptureIQ</span>
      </div>

      <div className="landing-plan">
        <div className="eyebrow">Study plan</div>
        <h1>Know Him More</h1>
        <p className="muted small">Reading plan: <em>One Story That Leads to Jesus</em> · BibleProject</p>
      </div>

      <div className="landing-center">
        <Link href={href} className="daybtn" aria-label={label}>
          {big}
          <span className="daybtn-sub">{sub}</span>
        </Link>
        <p className="muted small landing-date">{today !== null && raw !== null && raw >= 1 && raw <= TOTAL_DAYS ? formatDate(dateForDay(startDate, today)) : " "}</p>
      </div>

      <div className="daystrip" ref={strip} aria-label="All plan days">
        {DAYS.map((d) => (
          <Link
            key={d}
            href={`/day/${d}`}
            prefetch={false}
            className={`daychip${d === today ? " today" : ""}${done.has(d) ? " done" : ""}`}
            data-today={d === today ? "true" : undefined}
            aria-label={`Day ${d}, ${formatDate(dateForDay(startDate, d), { weekday: "long", month: "long", day: "numeric" })}${done.has(d) ? ", completed" : ""}`}
          >
            <span className="daychip-num">{d}</span>
            <span className="daychip-date">{d === today ? "Today" : formatDate(dateForDay(startDate, d), { month: "short", day: "numeric" })}</span>
          </Link>
        ))}
      </div>
      <p className="muted small landing-hint">Swipe through Days 1–{TOTAL_DAYS}</p>
    </div>
  );
}
