"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { saveProgress, type SegmentProgress } from "@/app/(app)/day/[day]/read/actions";
import { loadVoicePrefs, pickVoice } from "@/lib/voice";

type Block = { html: string; text: string };
type PassageView = { label: string; blocks: Block[] | null; error?: string; externalUrl: string };
type Pos = { segment: number; block: number };
/** Paragraphs credited as read, per segment. */
type ReadMap = Record<number, Set<number>>;

const noop = () => () => {};
const useCanSpeak = () => useSyncExternalStore(noop, () => "speechSynthesis" in window, () => false);

const totalFor = (p: PassageView) => (p.blocks ? p.blocks.length : 1);
const key = (p: Pos) => `${p.segment}:${p.block}`;

/**
 * Time a paragraph must stay in the reading band before it counts as read: about 60% of a
 * comfortable reading pace (150 ms a word), never under 2.5 s or over 20 s. A quick scroll to see
 * how long the reading is won't count; actually reading it will.
 */
const dwellNeeded = (text: string) => Math.min(20_000, Math.max(2_500, text.split(/\s+/).length * 150));

/** Restores credited paragraphs. Older saves only stored a count, so credit that many from the top. */
function restoreRead(saved: SegmentProgress, passages: PassageView[]): ReadMap {
  const map: ReadMap = {};
  passages.forEach((p, i) => {
    const s = saved[i];
    const total = totalFor(p);
    const list = s?.read ?? Array.from({ length: Math.min(s?.done ?? 0, total) }, (_, j) => j);
    map[i] = new Set(list.filter((j) => j < total));
  });
  return map;
}

export default function Reader({ header, intro, day, passages, saved, position, completed }: {
  header?: ReactNode; intro?: ReactNode; day: number; passages: PassageView[]; saved: SegmentProgress; position: Pos | null; completed: boolean;
}) {
  const canSpeak = useCanSpeak();
  const [read, setRead] = useState<ReadMap>(() => restoreRead(saved, passages));
  const [here, setHere] = useState<Pos>(position ?? { segment: 0, block: 0 });
  const [playing, setPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(completed);
  const playingRef = useRef(false);
  const hereRef = useRef(here);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const dwell = useRef(new Map<string, number>());

  const segDone = (r: ReadMap, i: number) => (r[i]?.size ?? 0) >= totalFor(passages[i]);

  const persist = useCallback((r: ReadMap, pos: Pos) => {
    const segments: SegmentProgress = {};
    passages.forEach((p, i) => {
      const list = [...(r[i] ?? [])].sort((a, b) => a - b);
      segments[i] = { done: list.length, total: totalFor(p), read: list };
    });
    const done = passages.every((p, i) => (r[i]?.size ?? 0) >= totalFor(p));
    if (done) setIsComplete(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void saveProgress(day, segments, pos, done); }, done ? 0 : 1500);
  }, [day, passages]);

  /** Credits a paragraph as read. Credit is never taken away by scrolling back. */
  const credit = useCallback((pos: Pos) => {
    setRead((prev) => {
      if (prev[pos.segment]?.has(pos.block)) return prev;
      const next = { ...prev, [pos.segment]: new Set(prev[pos.segment]).add(pos.block) };
      persist(next, hereRef.current);
      return next;
    });
  }, [persist]);

  const moveHere = useCallback((pos: Pos) => {
    hereRef.current = pos;
    setHere((prev) => (prev.segment === pos.segment && prev.block === pos.block ? prev : pos));
  }, []);

  // Resume where the reader stopped.
  useEffect(() => {
    if (position) els.current.get(key(position))?.scrollIntoView({ block: "center" });
  }, [position]);

  // "Where you are" follows the paragraph crossing the reading line, in both directions.
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      if (playingRef.current) return; // audio drives the position while it plays
      if (window.scrollY < 8) return; // the top of the page is handled below
      for (const e of entries) {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          moveHere({ segment: Number(el.dataset.seg), block: Number(el.dataset.block) });
        }
      }
    }, { rootMargin: "-35% 0px -60% 0px", threshold: 0 });
    els.current.forEach((el) => obs.observe(el));
    // At the very top the first paragraph can't reach the reading line, so the top counts as paragraph 1.
    const atTop = () => {
      if (!playingRef.current && window.scrollY < 8) {
        const first = passages.findIndex((p) => p.blocks?.length);
        if (first >= 0) moveHere({ segment: first, block: 0 });
      }
    };
    window.addEventListener("scroll", atTop, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener("scroll", atTop); };
  }, [moveHere, passages]);

  // Time spent on the paragraph at the reading line earns it a "read" credit.
  useEffect(() => {
    const TICK = 500;
    const id = setInterval(() => {
      if (playingRef.current || document.visibilityState !== "visible") return;
      const pos = hereRef.current;
      const block = passages[pos.segment]?.blocks?.[pos.block];
      if (!block) return;
      const k = key(pos);
      const t = (dwell.current.get(k) ?? 0) + TICK;
      dwell.current.set(k, t);
      if (t >= dwellNeeded(block.text)) credit(pos);
    }, TICK);
    return () => clearInterval(id);
  }, [passages, credit]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const step = (p: Pos, dir: 1 | -1): Pos | null => {
    let { segment, block } = p;
    block += dir;
    while (segment >= 0 && segment < passages.length) {
      const len = passages[segment].blocks?.length ?? 0;
      if (block >= 0 && block < len) return { segment, block };
      segment += dir;
      if (segment < 0 || segment >= passages.length) return null;
      block = dir === 1 ? 0 : (passages[segment].blocks?.length ?? 0) - 1;
    }
    return null;
  };

  const stop = () => { playingRef.current = false; setPlaying(false); window.speechSynthesis?.cancel(); };

  const speakFrom = (p: Pos) => {
    const block = passages[p.segment]?.blocks?.[p.block];
    if (!block) { const n = step(p, 1); if (n) speakFrom(n); else stop(); return; }
    moveHere(p);
    els.current.get(key(p))?.scrollIntoView({ block: "center", behavior: "smooth" });
    const u = new SpeechSynthesisUtterance(block.text);
    const prefs = loadVoicePrefs();
    const voice = pickVoice(window.speechSynthesis.getVoices(), prefs);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US";
    u.rate = prefs.rate;
    u.onend = () => {
      if (!playingRef.current) return;
      credit(p);
      const n = step(p, 1);
      if (n) speakFrom(n); else stop();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const play = () => { playingRef.current = true; setPlaying(true); speakFrom(hereRef.current); };
  // Skipping moves "where you are" either way; it doesn't add or remove read credit.
  const skip = (dir: 1 | -1) => {
    const n = step(hereRef.current, dir);
    if (!n) return;
    if (playingRef.current) speakFrom(n);
    else { moveHere(n); els.current.get(key(n))?.scrollIntoView({ block: "center", behavior: "smooth" }); }
  };

  const markSegment = (i: number) => credit({ segment: i, block: 0 });

  const hasText = passages.some((p) => p.blocks);
  const seg = passages[here.segment];
  const sectionsRead = passages.filter((_, i) => segDone(read, i)).length;
  const status = isComplete
    ? "Day complete ✓"
    : hasText && seg?.blocks
      ? `${seg.label} · paragraph ${here.block + 1} of ${seg.blocks.length} · ${sectionsRead} of ${passages.length} sections read`
      : `${sectionsRead} of ${passages.length} read`;

  return (
    <div>
      <div className="dayhead">
        {header}
        <div className="readbar">
        <div className="legend" aria-hidden>
          {hasText && <span><b className="line" style={{ background: "var(--brand)" }} />Where you are</span>}
          <span><b style={{ background: "var(--read)" }} />Read</span>
          <span><b style={{ background: "var(--ok)" }} />Section complete</span>
        </div>
        <div className="tracker" aria-label="Reading progress">
          {passages.map((p, i) => {
            const total = totalFor(p);
            const done = segDone(read, i);
            const readPct = done ? 100 : Math.min(100, ((read[i]?.size ?? 0) / total) * 100);
            const herePct = !p.blocks ? 0 : i < here.segment ? 100 : i === here.segment ? ((here.block + 1) / total) * 100 : 0;
            return (
              <div key={i} className={`cell${done ? " done" : ""}`} title={`${p.label}: ${done ? "complete" : `${read[i]?.size ?? 0} of ${total} paragraphs read`}`}>
                <span className="bar"><i style={{ width: `${readPct}%` }} /></span>
                {hasText && <span className="pos"><i style={{ width: `${herePct}%` }} /></span>}
              </div>
            );
          })}
        </div>
        <div className="spread small muted">
          <span aria-live="polite">{status}</span>
          {hasText && canSpeak && (
            <span className="player">
              <button className="btn ghost" onClick={() => skip(-1)} aria-label="Previous paragraph">⏮</button>
              {playing
                ? <button className="btn secondary" onClick={stop}>❚❚ Pause</button>
                : <button className="btn secondary" onClick={play}>▶ Listen</button>}
              <button className="btn ghost" onClick={() => skip(1)} aria-label="Next paragraph">⏭</button>
            </span>
          )}
        </div>
        </div>
      </div>
      {intro}

      {passages.map((p, i) => (
        <section key={i} className="card">
          <h2>{p.label}</h2>
          {p.blocks ? (
            <div className="scripture">
              {p.blocks.map((b, j) => (
                <div
                  key={j}
                  data-seg={i}
                  data-block={j}
                  ref={(el) => { if (el) els.current.set(`${i}:${j}`, el); else els.current.delete(`${i}:${j}`); }}
                  className={`block${playing && here.segment === i && here.block === j ? " active" : ""}`}
                  dangerouslySetInnerHTML={{ __html: b.html }}
                />
              ))}
            </div>
          ) : (
            <div>
              {p.error && p.error !== "not-configured" && <p className="error small">Couldn&rsquo;t load this passage ({p.error}).</p>}
              <div className="row">
                <a className="btn secondary" href={p.externalUrl} target="_blank" rel="noopener noreferrer">Read on Bible.com</a>
                <button className="btn" onClick={() => markSegment(i)} disabled={segDone(read, i)}>
                  {segDone(read, i) ? "Read ✓" : "Mark as read"}
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
      {/* Room to scroll the last paragraph up to the reading line. */}
      {hasText && <div aria-hidden style={{ height: "40vh" }} />}
    </div>
  );
}
