import { parse, type HTMLElement } from "node-html-parser";

/** A read-aloud unit: one paragraph or poetry line. `text` is what the device speaks. */
export type Block = { html: string; text: string };

const BLOCK_SELECTOR = "p, .p, .m, .pi, .pi1, .q, .q1, .q2, .q3, .li, .li1, .li2, .d, .b";
const STRIP_SELECTOR = "sup, .verse-num, .v, .yv-v, .label, .note, .yv-n, .f, .x";

/** Splits passage markup into paragraphs / poetry lines for read-aloud and the tracker. */
export function toBlocks(html: string): Block[] {
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
