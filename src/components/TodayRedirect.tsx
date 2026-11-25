"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dayForDate } from "@/lib/plan";

/** Works out today's plan day from the device's local date, so evening readers aren't moved ahead by UTC. */
export default function TodayRedirect({ startDate }: { startDate: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/day/${dayForDate(startDate, new Date())}`);
  }, [router, startDate]);
  return <p className="muted">Opening today&rsquo;s reading…</p>;
}
