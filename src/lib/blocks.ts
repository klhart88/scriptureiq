import { parse, type HTMLElement } from "node-html-parser";

/** A read-aloud unit: one paragraph or poetry line. `text` is what the device speaks. */
export type Block = { html: string; text: string };

const BLOCK_SELECTOR = "p, .p, .m, .pi, .pi1, .q, .q1, .q2, .q3, .li, .li1, .li2, .d, .b";
// Verse numbers and notes: shown small on screen, skipped by read-aloud. YouVersion labels verse numbers .yv-vlbl.
const STRIP_SELECTOR = "sup, .yv-vlbl, .verse-num, .v, .label, .note, .yv-n, .f, .x";

/** Splits passage markup into paragraphs / poetry lines for read-aloud and the tracker. */
export function toBlocks(html: string): Block[] {
  if (!/<(p|div|span|br|sup|h[1-6])\b/i.test(html)) return textToBlocks(html);
  const root = parse(html);
  const all = root.querySelectorAll(BLOCK_SELECTOR);
  const leaves = all.filter((el) => !el.querySelector(BLOCK_SELECTOR) && el.text.trim());
  const els: HTMLElement[] = leaves.length ? leaves : [root];
  return els.map((el) => {
    const clone = parse(el.toString());
    clone.querySelectorAll(STRIP_SELECTOR).forEach((n) => n.remove());
    return { html: leaves.length ? el.innerHTML : el.toString(), text: clone.text.replace(/\s+/g, " ").trim() };
  });
}

const escapeHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Plain-text passages (YouVersion's default) have no paragraph markup. Use line breaks when present;
 * otherwise group sentences into short blocks (about 3 sentences / 450 characters) so read-aloud and the
 * tracker move in comfortable steps.
 */
export function textToBlocks(text: string): Block[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];
  const lines = clean.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const units = lines.length > 1 ? lines : (clean.match(/[^.!?]+[.!?]+["'”’)\]]*\s*|[^.!?]+$/g) ?? [clean]).map((x) => x.trim()).filter(Boolean);
  if (lines.length > 1) return units.map((u) => ({ html: escapeHtml(u), text: u }));
  const blocks: string[] = [];
  let cur: string[] = [];
  for (const sentence of units) {
    cur.push(sentence);
    const joined = cur.join(" ");
    if (cur.length >= 3 || joined.length >= 450) { blocks.push(joined); cur = []; }
  }
  if (cur.length) blocks.push(cur.join(" "));
  return blocks.map((b) => ({ html: escapeHtml(b), text: b }));
}
