import { test } from "node:test";
import assert from "node:assert/strict";
import { citedDays } from "../src/lib/aggregate-cite.ts";

test("citedDays finds [Day n] in order without repeats or out-of-range days", () => {
  assert.deepEqual(citedDays("Mercy [Day 2] and faith [Day 5], again [Day 2]; bad [Day 400]"), [2, 5]);
  assert.deepEqual(citedDays("No citations"), []);
});

test("answerParts turns citations into day links", async () => {
  const { answerParts } = await import("../src/lib/aggregate-cite.ts");
  assert.deepEqual(answerParts("I saw mercy [Day 2]."), [{ text: "I saw mercy " }, { day: 2 }, { text: "." }]);
});
