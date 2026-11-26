export const TOTAL_DAYS = 358;

export type PlanDay = {
  day: number;
  reading: string;
  reading_code: string;
  psalm: string;
  psalm_code: string;
  section: string | null;
  book: string | null;
  video_title: string | null;
  video_url: string | null;
  guide_title: string | null;
  guide_url: string | null;
  article_title: string | null;
  article_url: string | null;
  main_theme: string | null;
  pre_where: string;
  pre_watch: string;
  q1: string;
  q2_connect: string;
  q2_reveal: string | null;
  q3: string;
  practice: string | null;
  identity: string | null;
  q2_link: string | null;
};

export const BOOKS: Record<string, string> = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy", JOS: "Joshua",
  JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Kings", "2KI": "2 Kings",
  "1CH": "1 Chronicles", "2CH": "2 Chronicles", EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job",
  PSA: "Psalm", PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song of Songs", ISA: "Isaiah", JER: "Jeremiah",
  LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea", JOL: "Joel", AMO: "Amos",
  OBA: "Obadiah", JON: "Jonah", MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah",
  HAG: "Haggai", ZEC: "Zechariah", MAL: "Malachi", MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John",
  ACT: "Acts", ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", GAL: "Galatians",
  EPH: "Ephesians", PHP: "Philippians", COL: "Colossians", "1TH": "1 Thessalonians", "2TH": "2 Thessalonians",
  "1TI": "1 Timothy", "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon", HEB: "Hebrews", JAS: "James",
  "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", JUD: "Jude",
  REV: "Revelation",
};

/** One unit of reading: a chapter, or a verse range within a chapter. One tracker segment each. */
export type Segment = { usfm: string; label: string; book: string; chapter: number; verses?: [number, number] };

/**
 * Expands a plan code into segments. Handles GEN.1-3, GEN.1, PSA.119.1-32 and 2JN.1+3JN.1.
 */
export function parseSegments(code: string): Segment[] {
  return code.split("+").flatMap((part) => {
    const m = part.trim().match(/^([1-3A-Z]{3})\.(\d+)(?:\.(\d+)-(\d+)|-(\d+))?$/);
    if (!m) throw new Error(`Unrecognized reading code: ${part}`);
    const [, book, ch, v1, v2, chEnd] = m;
    const name = BOOKS[book] ?? book;
    const start = Number(ch);
    if (v1) {
      return [{ usfm: `${book}.${start}.${v1}-${v2}`, label: `${name} ${start}:${v1}–${v2}`, book, chapter: start, verses: [Number(v1), Number(v2)] as [number, number] }];
    }
    const end = chEnd ? Number(chEnd) : start;
    const out: Segment[] = [];
    for (let c = start; c <= end; c++) out.push({ usfm: `${book}.${c}`, label: `${name} ${c}`, book, chapter: c });
    return out;
  });
}

/** All segments for a day: the main reading, then the daily psalm. */
export function daySegments(d: Pick<PlanDay, "reading_code" | "psalm_code">): Segment[] {
  return [...parseSegments(d.reading_code), ...parseSegments(d.psalm_code)];
}

/** Plan day for a calendar date, given the member's start date (Day 1). Clamped to 1–358. */
export function dayForDate(startDate: string, today: Date = new Date()): number {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const n = Math.floor((now - start) / 86_400_000) + 1;
  return Math.min(Math.max(n, 1), TOTAL_DAYS);
}

/** Calendar date (YYYY-MM-DD) for a plan day. */
export function dateForDay(startDate: string, day: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + day - 1)).toISOString().slice(0, 10);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", opts);
}

export function parseDayParam(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_DAYS ? n : null;
}

export const BIBLEPROJECT_CREDIT =
  "BibleProject is the author and owner of this content. To find more BibleProject resources, visit bibleproject.com.";
