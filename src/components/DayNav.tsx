import Link from "next/link";
import { TOTAL_DAYS } from "@/lib/plan";

export type DayStep = "before" | "reading" | "reflections";

const STEPS: { id: DayStep; label: string; href: (d: number) => string }[] = [
  { id: "before", label: "Before you read", href: (d) => `/day/${d}` },
  { id: "reading", label: "Reading", href: (d) => `/day/${d}/read` },
  { id: "reflections", label: "Reflections", href: (d) => `/notes/${d}` },
];

/**
 * Step bar shown on every part of a day: jump between Before you read, Reading and Reflections in
 * either direction, or move to the same step of the previous / next day.
 */
export default function DayNav({ day, step }: { day: number; step: DayStep }) {
  const current = STEPS.find((s) => s.id === step)!;
  return (
    <nav className="daynav" aria-label={`Day ${day}`}>
      {day > 1
        ? <Link className="dayarrow" href={current.href(day - 1)} aria-label={`Day ${day - 1}`}>‹</Link>
        : <span className="dayarrow" aria-hidden />}
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <Link href={s.href(day)} aria-current={s.id === step ? "step" : undefined}>
              <span className="num">{i + 1}</span>
              <span className="label">{s.label}</span>
            </Link>
          </li>
        ))}
      </ol>
      {day < TOTAL_DAYS
        ? <Link className="dayarrow" href={current.href(day + 1)} aria-label={`Day ${day + 1}`}>›</Link>
        : <span className="dayarrow" aria-hidden />}
    </nav>
  );
}
