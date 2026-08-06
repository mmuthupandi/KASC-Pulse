"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion } from "motion/react";
import {
  TrendingUp,
  CalendarCheck,
  CalendarX,
  BookOpen,
  Download,
  FileText,
  Calendar,
  ClipboardCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Heatmap } from "@/components/heatmap";
import {
  currentUser,
  todayTimetable,
  subjectAttendance,
  notifications,
} from "@/lib/mock-data";

import { useEffect } from "react";

export default function Page() { 
  return <StudentDashboard />; 
}

function StudentDashboard() {
  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Good morning, {currentUser.name.split(" ")[0]}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tuesday, 21 May 2024 · {currentUser.department} ({currentUser.stream}) · {currentUser.semester}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden bg-primary p-5 text-primary-foreground shadow-lg">
            <div className="text-sm text-white/80">Overall Attendance</div>
            <div className="mt-1 flex items-end gap-3">
              <div className="text-4xl font-semibold">89%</div>
              <div className="mb-1 flex items-center text-xs text-white/80">
                <TrendingUp className="mr-1 h-3 w-3" /> 6% this month
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-secondary" style={{ width: "89%" }} />
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          </Card>
        </motion.div>
        <StatCard title="Classes Attended" value="74" hint="of 83" icon={<CalendarCheck className="h-5 w-5" />} accent="green" />
        <StatCard title="Classes Missed" value="9" hint="of 83" icon={<CalendarX className="h-5 w-5" />} accent="red" />
        <StatCard title="Subjects" value="6" hint="This semester" icon={<BookOpen className="h-5 w-5" />} accent="yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Today's Timetable</h3>
            <Link href="/student/timetable" className="text-sm text-primary hover:underline">View full timetable</Link>
          </div>
          <div className="space-y-2">
            {todayTimetable.map((row) => (
              <div key={row.time} className="flex items-center justify-between rounded-xl border p-3 transition hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-muted-foreground">{row.time}</div>
                  <div>
                    <div className="font-medium">{row.subject}</div>
                    <div className="text-xs text-muted-foreground">{row.room} · {row.faculty}</div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    row.status === "present"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                  }
                >
                  {row.status === "present" ? "Present" : "Upcoming"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Attendance by Subject</h3>
            <span className="text-xs text-muted-foreground">This semester</span>
          </div>
          <div className="space-y-4">
            {subjectAttendance.map((s, i) => (
              <div key={s.subject}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{s.subject}</span>
                  <span className="text-muted-foreground">{s.percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.percentage}%`,
                      background: `var(--color-${["primary", "secondary", "warning", "destructive", "primary", "secondary"][i % 6]})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Monthly Attendance Overview</h3>
            <span className="text-xs text-muted-foreground">Jan – Jun</span>
          </div>
          <Heatmap />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Notifications</h3>
            <a href="#" className="text-sm text-primary hover:underline">View All</a>
          </div>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.title} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <div className="text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.date}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/attendance"><ClipboardCheck className="mr-2 h-4 w-4" />Attendance</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/leave"><FileText className="mr-2 h-4 w-4" />Apply Leave</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/timetable"><Calendar className="mr-2 h-4 w-4" />Timetable</Link>
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => {
              import("sonner").then(({ toast }) => {
                toast.loading("Generating Excel report...", { id: "export" });
                setTimeout(() => {
                  const csvContent = "Subject,Percentage\\nData Structures,92%\\nOperating Systems,85%\\nDatabase Management,88%\\nComputer Networks,90%\\n";
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement("a");
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute("download", "Attendance_Report.csv");
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  toast.success("Excel report downloaded successfully!", { id: "export" });
                }, 1500);
              });
            }}>
              <Download className="mr-2 h-4 w-4" />Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}