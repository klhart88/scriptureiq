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

test("plain text: a short verse is one block", () => {
  const b = toBlocks("Jesus wept.");
  assert.equal(b.length, 1);
  assert.equal(b[0].text, "Jesus wept.");
});

test("plain text: sentences are grouped into short blocks and escaped", () => {
  const text = "Blessed are those whose ways are blameless, who walk according to the law of the Lord. Blessed are those who keep his statutes and seek him with all their heart— they do no wrong but follow his ways. You have laid down precepts that are to be fully obeyed. Oh, that my ways were steadfast in obeying your decrees! Then I would not be put to shame <when> I consider all your commands.";
  const b = toBlocks(text);
  assert.equal(b.length, 2);
  assert.ok(b.every((x) => x.text.length > 0));
  assert.equal(b.map((x) => x.text).join(" "), text);
  assert.match(b[1].html, /&lt;when&gt;/);
});

test("plain text: line breaks become blocks", () => {
  const b = toBlocks("In the beginning God created the heavens and the earth.\nNow the earth was formless and empty.");
  assert.equal(b.length, 2);
});
