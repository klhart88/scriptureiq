/** Days cited as [Day 12] in a Study Aggregate answer, in order, without repeats. */
export function citedDays(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\[Day (\d{1,3})\]/g)) {
    const d = Number(m[1]);
    if (d >= 1 && d <= 358 && !out.includes(d)) out.push(d);
  }
  return out;
}

/** Splits an answer into text and day links, for rendering "[Day 12]" as a link to that day's notes. */
export function answerParts(text: string): ({ text: string } | { day: number })[] {
  const parts: ({ text: string } | { day: number })[] = [];
  let last = 0;
  for (const m of text.matchAll(/\[Day (\d{1,3})\]/g)) {
    const d = Number(m[1]);
    if (d < 1 || d > 358) continue;
    if (m.index! > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ day: d });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
