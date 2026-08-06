"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { CalendarCheck, CalendarX, Percent } from "lucide-react";
import { Heatmap } from "@/components/heatmap";

export default function Page() { return <AttendancePage />; }

function AttendancePage() {
  const days = Array.from({ length: 35 }).map((_, i) => {
    const rand = Math.random();
    const d = i - 2;
    if (d < 1 || d > 31) return { day: null, status: "none" };
    const dow = (d + 2) % 7;
    if (dow === 0 || dow === 6) return { day: d, status: "none" };
    let status: "present" | "absent" | "leave" | "none" = "present";
    if (rand > 0.9) status = "absent";
    else if (rand > 0.82) status = "leave";
    return { day: d, status };
  });

  const color = (s: string) =>
    s === "present"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      : s === "absent"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
        : s === "leave"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          : "bg-transparent text-muted-foreground";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monthly calendar view and detailed statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Monthly Attendance" value="91%" hint="21 present · 2 absent" icon={<Percent className="h-5 w-5" />} accent="teal" />
        <StatCard title="Weekly Attendance" value="4/5" hint="This week" icon={<CalendarCheck className="h-5 w-5" />} accent="green" />
        <StatCard title="Total Missed" value="9" hint="This semester" icon={<CalendarX className="h-5 w-5" />} accent="red" />
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">May 2024</h3>
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((c, i) => (
            <div key={i} className={`aspect-square rounded-xl border p-2 text-sm ${color(c.status)}`}>
              <div className="font-medium">{c.day ?? ""}</div>
              {c.status !== "none" && c.day && (
                <div className="mt-1 text-[10px] capitalize">{c.status}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Semester Heatmap</h3>
        <Heatmap />
      </Card>
    </div>
  );
}