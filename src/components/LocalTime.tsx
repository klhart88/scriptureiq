"use client";

import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/time";

const noop = () => () => {};

/**
 * Shows a date in the member's own time zone. The server doesn't know it, so the date is filled in
 * once the page reaches the browser (an evening entry in Indiana no longer shows tomorrow's date).
 */
export default function LocalTime({ iso, mode = "date" }: { iso: string; mode?: "date" | "ago" }) {
  const text = useSyncExternalStore(
    noop,
    () => (mode === "ago" ? timeAgo(iso) : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    () => null,
  );
  return <time dateTime={iso}>{text ?? " "}</time>;
}
