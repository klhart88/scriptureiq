import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { daySegments, dayForDate, dateForDay, parseSegments } from "../src/lib/plan.ts";

const days = JSON.parse(readFileSync(new URL("../supabase/plan_days.json", import.meta.url), "utf8"));

test("every plan day parses into segments", () => {
  let total = 0;
  for (const d of days) {
    const segs = daySegments(d);
    assert.ok(segs.length >= 2, `day ${d.day}`);
    assert.ok(segs.at(-1)!.book === "PSA", `day ${d.day} ends with its psalm`);
    total += segs.length;
  }
  assert.equal(days.length, 358);
  console.log("segments across plan:", total);
});

test("code forms", () => {
  assert.deepEqual(parseSegments("GEN.1-3").map((s) => s.label), ["Genesis 1", "Genesis 2", "Genesis 3"]);
  assert.deepEqual(parseSegments("2JN.1+3JN.1").map((s) => s.usfm), ["2JN.1", "3JN.1"]);
  const [p] = parseSegments("PSA.119.1-32");
  assert.equal(p.label, "Psalm 119:1–32");
  assert.equal(p.usfm, "PSA.119.1-32"); // the form YouVersion accepts (checked against the live API)
});

test("dates", () => {
  assert.equal(dayForDate("2026-01-01", new Date(2026, 0, 1)), 1);
  assert.equal(dayForDate("2026-01-01", new Date(2026, 0, 31, 23, 30)), 31);
  assert.equal(dayForDate("2026-01-01", new Date(2025, 11, 1)), 1);
  assert.equal(dayForDate("2026-01-01", new Date(2027, 5, 1)), 358);
  assert.equal(dateForDay("2026-01-01", 358), "2026-12-24");
});
