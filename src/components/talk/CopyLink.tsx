"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this invite link:", url);
    }
  };
  return (
    <div className="copylink">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Invite link" />
      <button type="button" className="btn secondary" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
    </div>
  );
}
