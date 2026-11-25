import { test } from "node:test";
import assert from "node:assert/strict";
import { toBlocks } from "../src/lib/blocks.ts";

test("splits paragraphs and strips verse numbers for speech", () => {
  const html = `<div class="chapter"><h3 class="s">The Beginning</h3><div class="p"><span class="verse-num">1</span>In the beginning God created the heavens and the earth. <sup>2</sup>Now the earth was formless.</div><div class="q1"><span class="v">3</span>Let there be light,</div></div>`;
  const b = toBlocks(html);
  assert.equal(b.length, 2);
  assert.equal(b[0].text, "In the beginning God created the heavens and the earth. Now the earth was formless.");
  assert.match(b[0].html, /verse-num/);
});

test("falls back to one block for plain text", () => {
  const b = toBlocks("Jesus wept.");
  assert.equal(b.length, 1);
  assert.equal(b[0].text, "Jesus wept.");
});
