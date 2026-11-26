import Link from "next/link";
import { notFound } from "next/navigation";
import DayNav from "@/components/DayNav";
import Reader from "@/components/Reader";
import { bibleComUrl, bibleConfigured, fetchPassage, NIV_COPYRIGHT } from "@/lib/bible";
import { getPlanDay, requireMember } from "@/lib/data";
import { daySegments, parseDayParam } from "@/lib/plan";
import type { SegmentProgress } from "./actions";

export default async function ReadingPage({ params }: { params: Promise<{ day: string }> }) {
  const day = parseDayParam((await params).day);
  if (!day) notFound();
  const { supabase } = await requireMember();
  const d = await getPlanDay(supabase, day);
  const segments = daySegments(d);
  const [passages, { data: progress }] = await Promise.all([
    Promise.all(segments.map(fetchPassage)),
    supabase.from("day_progress").select("segments, position, completed_at").eq("day", day).maybeSingle(),
  ]);

  return (
    <article>
      <DayNav day={day} step="reading" />
      <div className="eyebrow">Day {day}</div>
      <h1>{d.reading} <span className="muted small">· {d.psalm}</span></h1>
      {!bibleConfigured() && (
        <p className="small muted">
          The NIV text will appear here once the YouVersion app key is added. Until then, open each passage on Bible.com and mark it read.
        </p>
      )}
      <Reader
        day={day}
        passages={passages.map((p) => ({ label: p.segment.label, blocks: p.blocks, error: p.error, externalUrl: bibleComUrl(p.segment) }))}
        saved={(progress?.segments as SegmentProgress) ?? {}}
        position={(progress?.position as { segment: number; block: number } | null) ?? null}
        completed={Boolean(progress?.completed_at)}
      />
      {passages.some((p) => p.blocks) && <p className="credit">{NIV_COPYRIGHT}</p>}

      <section className="card" style={{ marginTop: "1.5rem" }}>
        {(d.guide_url || d.article_url) && (
          <>
            <h3>Go deeper (optional)</h3>
            <ul className="small" style={{ paddingLeft: "1.1rem" }}>
              {d.guide_url && <li><a href={d.guide_url} target="_blank" rel="noopener noreferrer">Guide: {d.guide_title}</a></li>}
              {d.article_url && <li><a href={d.article_url} target="_blank" rel="noopener noreferrer">Article: {d.article_title}</a></li>}
            </ul>
          </>
        )}
        <Link className="btn block" href={`/notes/${day}`}>Write today&rsquo;s reflections</Link>
      </section>
    </article>
  );
}
