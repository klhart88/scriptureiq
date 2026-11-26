"use client";

/** Friendly fallback if a page fails (for example, right after a new version was deployed). */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card">
      <h1>Something didn&rsquo;t load</h1>
      <p className="muted">This can happen right after ScriptureIQ is updated. Try again, and if it keeps happening, reload the page.</p>
      <div className="row">
        <button className="btn" onClick={() => reset()}>Try again</button>
        <button className="btn secondary" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    </div>
  );
}
