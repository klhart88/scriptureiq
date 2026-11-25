import { BIBLEPROJECT_CREDIT } from "@/lib/plan";

function youTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

/** BibleProject video: embedded when the link is a YouTube link, otherwise opened on bibleproject.com. */
export default function Video({ title, url }: { title: string; url: string }) {
  const id = youTubeId(url);
  return (
    <div>
      {id ? (
        <div className="video">
          <iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={title} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
        </div>
      ) : (
        <a className="btn secondary" href={url} target="_blank" rel="noopener noreferrer">▶ Watch: {title}</a>
      )}
      <p className="credit">{BIBLEPROJECT_CREDIT}</p>
    </div>
  );
}
