"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { TrendingUp, CalendarCheck, CalendarX, BookOpen, FileText, Calendar, ClipboardCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Heatmap } from "@/components/heatmap";
import { subjectAttendance, notifications } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Page() { 
  return <StudentDashboard />; 
}

function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // 5 periods timetable template
  const [timetable, setTimetable] = useState([
    { period: 1, time: "09:00 AM - 10:00 AM", subject: "OS", room: "L-301", faculty: "Prof. Verma", status: "upcoming" },
    { period: 2, time: "10:00 AM - 11:00 AM", subject: "Software Engineering & Testing", room: "L-302", faculty: "Dr. Sharma", status: "upcoming" },
    { period: 3, time: "11:00 AM - 12:00 PM", subject: "Cloud Computing", room: "L-303", faculty: "Prof. Singh", status: "upcoming" },
    { period: 4, time: "01:00 PM - 02:00 PM", subject: "DBMS", room: "L-304", faculty: "Dr. Gupta", status: "upcoming" },
    { period: 5, time: "02:00 PM - 03:00 PM", subject: "EDC", room: "L-305", faculty: "Prof. Kumar", status: "upcoming" },
  ]);
  const [overallPercentage, setOverallPercentage] = useState(100);
  const [dynamicSubjectAttendance, setDynamicSubjectAttendance] = useState([
    { subject: "OS", percentage: 100 },
    { subject: "Software Engineering & Testing", percentage: 100 },
    { subject: "Cloud Computing", percentage: 100 },
    { subject: "DBMS", percentage: 100 },
    { subject: "EDC", percentage: 100 }
  ]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allRecords = snapshot.docs.map(doc => doc.data());
        
        if (allRecords.length > 0) {
          const totalPresents = allRecords.filter(r => r.status === "present").length;
          setOverallPercentage(Math.round((totalPresents / allRecords.length) * 100));
        } else {
          setOverallPercentage(100);
        }

        // Calculate subject-wise attendance based on fixed periods
        const subjectStats: Record<number, { present: number, total: number, subject: string }> = {
          1: { present: 0, total: 0, subject: "OS" },
          2: { present: 0, total: 0, subject: "Software Engineering & Testing" },
          3: { present: 0, total: 0, subject: "Cloud Computing" },
          4: { present: 0, total: 0, subject: "DBMS" },
          5: { present: 0, total: 0, subject: "EDC" },
        };

        allRecords.forEach(r => {
          if (subjectStats[r.period]) {
            subjectStats[r.period].total++;
            if (r.status === "present") subjectStats[r.period].present++;
          }
        });

        const newSubjectData = Object.values(subjectStats).map(s => ({
          subject: s.subject,
          percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 100
        }));
        setDynamicSubjectAttendance(newSubjectData);

        // Filter by date in memory to avoid needing a composite index in Firestore
        const attendanceRecords = allRecords.filter(r => r.date === today);
        
        setTimetable(prev => prev.map(slot => {
          const record = attendanceRecords.find(r => r.period === slot.period);
          if (record) {
            return { ...slot, status: record.status }; // present or absent
          }
          return { ...slot, status: "upcoming" };
        }));
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (loading || !user) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const attended = timetable.filter(t => t.status === "present").length;
  const missed = timetable.filter(t => t.status === "absent").length;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Good morning, {user.name?.split(" ")[0] || "Student"}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden bg-primary p-5 text-primary-foreground shadow-lg">
            <div className="text-sm text-white/80">Overall Attendance</div>
            <div className="mt-1 flex items-end gap-3">
              <div className="text-4xl font-semibold">{overallPercentage}%</div>
              <div className="mb-1 flex items-center text-xs text-white/80">
                <TrendingUp className="mr-1 h-3 w-3" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${overallPercentage}%` }} />
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          </Card>
        </motion.div>
        <StatCard title="Classes Attended Today" value={attended.toString()} hint="out of 5" icon={<CalendarCheck className="h-5 w-5" />} accent="green" />
        <StatCard title="Classes Missed Today" value={missed.toString()} hint="out of 5" icon={<CalendarX className="h-5 w-5" />} accent="red" />
        <StatCard title="Subjects" value="5" hint="This semester" icon={<BookOpen className="h-5 w-5" />} accent="yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Today's Timetable (5 Periods)</h3>
            <Link href="/student/timetable" className="text-sm text-primary hover:underline">View full timetable</Link>
          </div>
          <div className="space-y-2">
            {timetable.map((row) => (
              <div key={row.period} className="flex items-center justify-between rounded-xl border p-3 transition hover:bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-muted-foreground">{row.time}</div>
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
                      : row.status === "absent"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                  }
                >
                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
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
            {dynamicSubjectAttendance.map((s, i) => (
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
                      background: `var(--color-${["primary", "secondary", "warning", "destructive", "primary"][i % 5]})`,
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
            <Button asChild variant="outline" className="rounded-xl col-span-2">
              <Link href="/student/timetable"><Calendar className="mr-2 h-4 w-4" />Timetable</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}