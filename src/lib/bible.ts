import "server-only";
import { toBlocks, type Block } from "./blocks";
import type { Segment } from "./plan";

/**
 * NIV text from the YouVersion Platform. Fetched live on every request and never stored or cached,
 * per the YouVersion terms. Requires YOUVERSION_APP_KEY, with the NIV licence accepted on
 * platform.youversion.com for that key.
 */
const API = "https://api.youversion.com/v1";
export const NIV_ID = Number(process.env.YOUVERSION_BIBLE_ID ?? 111);

export type { Block };
export type Passage = { segment: Segment; heading?: string; blocks: Block[] | null; error?: string };



export function bibleConfigured() {
  return Boolean(process.env.YOUVERSION_APP_KEY);
}

export async function fetchPassage(segment: Segment): Promise<Passage> {
  const key = process.env.YOUVERSION_APP_KEY;
  if (!key) return { segment, blocks: null, error: "not-configured" };
  try {
    const res = await fetch(`${API}/bibles/${NIV_ID}/passages/${encodeURIComponent(segment.usfm)}?format=html`, {
      headers: { "X-YVP-App-Key": key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return { segment, blocks: null, error: `YouVersion returned ${res.status}` };
    const json = (await res.json()) as { content?: string };
    const blocks = toBlocks(sanitize(json.content ?? ""));
    return { segment, blocks: blocks.length ? blocks : null, error: blocks.length ? undefined : "empty passage" };
  } catch (e) {
    return { segment, blocks: null, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

/** The API returns markup for display; strip anything executable before rendering it. */
function sanitize(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Link that opens the same passage on Bible.com, used when the text can't be shown here. */
export function bibleComUrl(segment: Segment) {
  const id = segment.verses ? `${segment.book}.${segment.chapter}.${segment.verses[0]}-${segment.verses[1]}` : segment.usfm;
  return `https://www.bible.com/bible/${NIV_ID}/${id}.NIV`;
}

export const NIV_COPYRIGHT =
  "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.";
