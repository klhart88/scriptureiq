"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { saveProgress, type SegmentProgress } from "@/app/(app)/day/[day]/read/actions";

type Block = { html: string; text: string };
type PassageView = { label: string; blocks: Block[] | null; error?: string; externalUrl: string };
type Pos = { segment: number; block: number };

const noop = () => () => {};
const useCanSpeak = () => useSyncExternalStore(noop, () => "speechSynthesis" in window, () => false);

const totalFor = (p: PassageView) => (p.blocks ? p.blocks.length : 1);

export default function Reader({ day, passages, saved, position, completed }: {
  day: number; passages: PassageView[]; saved: SegmentProgress; position: Pos | null; completed: boolean;
}) {
  const canSpeak = useCanSpeak();
  const [progress, setProgress] = useState<SegmentProgress>(() => {
    const p: SegmentProgress = {};
    passages.forEach((ps, i) => { p[i] = { done: Math.min(saved[i]?.done ?? 0, totalFor(ps)), total: totalFor(ps) }; });
    return p;
  });
  const [current, setCurrent] = useState<Pos>(position ?? { segment: 0, block: 0 });
  const [playing, setPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(completed);
  const playingRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const key = (p: Pos) => `${p.segment}:${p.block}`;

  const segDone = (p: SegmentProgress, i: number) => (p[i]?.done ?? 0) >= totalFor(passages[i]);

  const persist = useCallback((next: SegmentProgress, pos: Pos) => {
    const done = passages.every((ps, i) => (next[i]?.done ?? 0) >= totalFor(ps));
    if (done) setIsComplete(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void saveProgress(day, next, pos, done); }, done ? 0 : 1200);
  }, [day, passages]);

  /** Records that a block has been reached (read aloud or scrolled through). */
  const markRead = useCallback((pos: Pos) => {
    setProgress((prev) => {
      const done = Math.max(prev[pos.segment]?.done ?? 0, pos.block + 1);
      if (prev[pos.segment]?.done === done) return prev;
      const next = { ...prev, [pos.segment]: { done, total: totalFor(passages[pos.segment]) } };
      persist(next, pos);
      return next;
    });
  }, [passages, persist]);

  // Resume where the reader stopped.
  useEffect(() => {
    if (position) els.current.get(key(position))?.scrollIntoView({ block: "center" });
  }, [position]);

  // A block counts once it reaches the top 40% of the screen (or has scrolled past it).
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          const el = e.target as HTMLElement;
          markRead({ segment: Number(el.dataset.seg), block: Number(el.dataset.block) });
        }
      }
    }, { rootMargin: "0px 0px -60% 0px", threshold: 0 });
    els.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [markRead]);

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
    setCurrent(p);
    els.current.get(key(p))?.scrollIntoView({ block: "center", behavior: "smooth" });
    const u = new SpeechSynthesisUtterance(block.text);
    u.lang = "en-US";
    u.onend = () => {
      if (!playingRef.current) return;
      markRead(p);
      const n = step(p, 1);
      if (n) speakFrom(n); else stop();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const play = () => { playingRef.current = true; setPlaying(true); speakFrom(current); };
  const skip = (dir: 1 | -1) => {
    const n = step(current, dir);
    if (!n) return;
    if (playingRef.current) speakFrom(n);
    else { setCurrent(n); els.current.get(key(n))?.scrollIntoView({ block: "center", behavior: "smooth" }); }
  };

  const markSegment = (i: number) => markRead({ segment: i, block: 0 });

  const hasText = passages.some((p) => p.blocks);
  const seg = passages[current.segment];
  const status = isComplete
    ? "Day complete ✓"
    : hasText && seg?.blocks
      ? `${seg.label} · paragraph ${current.block + 1} of ${seg.blocks.length}`
      : `${passages.filter((_, i) => segDone(progress, i)).length} of ${passages.length} read`;

  return (
    <div>
      <div className="sticky">
        <div className="tracker" aria-label="Reading progress">
          {passages.map((p, i) => {
            const pct = Math.min(100, ((progress[i]?.done ?? 0) / totalFor(p)) * 100);
            return <span key={i} title={p.label}><i style={{ width: `${pct}%` }} /></span>;
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
                  className={`block${playing && current.segment === i && current.block === j ? " active" : ""}`}
                  dangerouslySetInnerHTML={{ __html: b.html }}
                />
              ))}
            </div>
          ) : (
            <div>
              {p.error && p.error !== "not-configured" && <p className="error small">Couldn&rsquo;t load this passage ({p.error}).</p>}
              <div className="row">
                <a className="btn secondary" href={p.externalUrl} target="_blank" rel="noopener noreferrer">Read on Bible.com</a>
                <button className="btn" onClick={() => markSegment(i)} disabled={segDone(progress, i)}>
                  {segDone(progress, i) ? "Read ✓" : "Mark as read"}
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
