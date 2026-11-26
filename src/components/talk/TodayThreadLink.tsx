"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { dayForDate } from "@/lib/plan";

/** "Your day" uses the device's local date and the member's own start date. */
export default function TodayThreadLink({ groupId, startDate }: { groupId: string; startDate: string | null }) {
  const day = useSyncExternalStore(() => () => {}, () => (startDate ? dayForDate(startDate, new Date()) : null), () => null);
  if (!startDate) return <Link className="btn" href="/settings">Set your start date to find your day</Link>;
  if (!day) return null;
  return <Link className="btn" href={`/groups/${groupId}/day/${day}`}>Today&rsquo;s thread · Day {day}</Link>;
}
