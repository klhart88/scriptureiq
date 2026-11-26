import Link from "next/link";
import { TOTAL_DAYS } from "@/lib/plan";

export type DayStep = "before" | "reading" | "reflections";

const STEPS: { id: DayStep; label: string; href: (d: number) => string }[] = [
  { id: "before", label: "Before you read", href: (d) => `/day/${d}` },
  { id: "reading", label: "Reading", href: (d) => `/day/${d}/read` },
  { id: "reflections", label: "Reflections", href: (d) => `/notes/${d}` },
];

/** Step bar for the parts of one day. It only moves between steps; changing days is done with DayFooter. */
export default function DayNav({ day, step }: { day: number; step: DayStep }) {
  return (
    <nav className="daynav" aria-label={`Day ${day} steps`}>
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
    </nav>
  );
}

/** Previous / next day links at the bottom of a page, keeping the same step. */
export function DayFooter({ day, step }: { day: number; step: DayStep }) {
  const href = STEPS.find((s) => s.id === step)!.href;
  return (
    <nav className="dayfooter" aria-label="Other days">
      {day > 1 ? <Link href={href(day - 1)}>← Day {day - 1}</Link> : <span />}
      {day < TOTAL_DAYS ? <Link href={href(day + 1)}>Day {day + 1} →</Link> : <span />}
    </nav>
  );
}
