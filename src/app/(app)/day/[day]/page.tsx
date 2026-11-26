import Link from "next/link";
import { notFound } from "next/navigation";
import DayNav, { DayFooter } from "@/components/DayNav";
import Video from "@/components/Video";
import { getPlanDay, requireMember } from "@/lib/data";
import { dateForDay, daySegments, formatDate, parseDayParam, TOTAL_DAYS } from "@/lib/plan";

export default async function BeforeYouRead({ params }: { params: Promise<{ day: string }> }) {
  const day = parseDayParam((await params).day);
  if (!day) notFound();
  const { supabase, profile } = await requireMember();
  const d = await getPlanDay(supabase, day);
  const { data: progress } = await supabase.from("day_progress").select("completed_at").eq("day", day).maybeSingle();
  const segments = daySegments(d);

  return (
    <article>
      <div className="dayhead"><DayNav day={day} step="before" /></div>
      <div className="spread">
        <div>
          <div className="eyebrow">
            Day {day} of {TOTAL_DAYS}
            {profile.start_date && <> · {formatDate(dateForDay(profile.start_date, day))}</>}
          </div>
          <h1>{d.reading}</h1>
          <p className="muted small">Daily psalm: {d.psalm}</p>
        </div>
        {progress?.completed_at && <span className="tag">Completed</span>}
      </div>

      <section className="card">
        <h2>Before you read</h2>
        <p>{d.pre_where}</p>
        <p>{d.pre_watch}</p>
        {d.video_url && d.video_title && <Video title={d.video_title} url={d.video_url} />}
      </section>

      <section className="card">
        <h2>Today&rsquo;s reading</h2>
        <ul className="small" style={{ paddingLeft: "1.1rem", marginTop: 0 }}>
          {segments.map((s) => <li key={s.usfm}>{s.label}</li>)}
        </ul>
        <Link className="btn block" href={`/day/${day}/read`}>Start reading</Link>
      </section>

      <DayFooter day={day} step="before" />
    </article>
  );
}
