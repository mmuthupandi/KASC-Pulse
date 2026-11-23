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
import { subjectAttendance, notifications, weeklyTimetable, makeHeatmap } from "@/lib/mock-data";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { collection, query, where, onSnapshot, getDoc, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FeedbackBanner } from "@/components/feedback-banner";
import { getDynamicGreeting } from "@/lib/utils";

const DAY_ORDER_MAP: Record<string, number> = {
  "I": 0, "II": 1, "III": 2, "IV": 3, "V": 4, "VI": 5
};

export default function Page() { 
  return <StudentDashboard />; 
}

function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [timetable, setTimetable] = useState([
    { period: 1, time: "10:00 AM - 11:00 AM", subject: "Loading...", room: "", faculty: "", status: "upcoming" },
  ]);
  const [dayOrderLabel, setDayOrderLabel] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);

  const [overallPercentage, setOverallPercentage] = useState(100);
  const [subjectCount, setSubjectCount] = useState(0);
  const [dynamicSubjectAttendance, setDynamicSubjectAttendance] = useState<Array<{ subject: string; percentage: number }>>([]);
  const [greeting, setGreeting] = useState("Welcome back!");

  useEffect(() => {
    if (user?.name) {
      setGreeting(getDynamicGreeting(user.name.split(" ")[0] || "Student"));
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      const today = new Date().toISOString().split('T')[0];
      const studentSem = user?.semester || "6th";
      const studentDept = user?.department || "B.Sc. Computer Science";
      const cleanDept = studentDept.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const cleanSem = studentSem.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const timetableDocId = `${cleanDept}_${cleanSem}`;

      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const allRecords = snapshot.docs.map(doc => doc.data());
        
        // Scope overall attendance calculation to current semester
        const currentSemRecords = allRecords.filter(r => !r.semester || r.semester === studentSem);
        if (currentSemRecords.length > 0) {
          const totalPresents = currentSemRecords.filter(r => r.status === "present").length;
          setOverallPercentage(Math.round((totalPresents / currentSemRecords.length) * 100));
        } else {
          setOverallPercentage(100);
        }

        // Fetch subjects & timetable from Firestore in parallel
        let activeSubjects: Array<{ name: string; code: string }> = [];
        let timetableDays: any[] = [];

        try {
          const [subSnap, ttSnap] = await Promise.all([
            getDocs(collection(db, "subjects")),
            getDoc(doc(db, "timetables", timetableDocId)),
          ]);

          // Filter subjects for student's active semester and department
          const semSubs = subSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .filter(s => (s.sem === studentSem || s.semester === studentSem) && (!s.department || s.department === studentDept));

          activeSubjects = semSubs.map(s => ({
            name: s.name,
            code: s.code || "",
          }));

          if (ttSnap.exists() && ttSnap.data()?.days) {
            timetableDays = ttSnap.data().days;
          }
        } catch (e) {
          console.error("Error fetching subjects/timetable:", e);
        }

        // Fallback to timetable unique subjects if subjects collection empty
        if (activeSubjects.length === 0 && timetableDays.length > 0) {
          const seen = new Set<string>();
          timetableDays.forEach(day => {
            day.slots?.forEach((slot: any) => {
              if (slot.subject && slot.subject !== "Free Period" && !seen.has(slot.subject)) {
                seen.add(slot.subject);
                activeSubjects.push({ name: slot.subject, code: slot.code || "" });
              }
            });
          });
        }

        setSubjectCount(activeSubjects.length);

        // Calculate attendance per active semester subject
        const newSubjectData = activeSubjects.map(s => {
          const matching = allRecords.filter((r: any) => 
            (r.semester === studentSem || !r.semester) &&
            (r.subjectCode === s.code || r.subject === s.name || (r.subject && r.subject.toLowerCase() === s.name.toLowerCase()))
          );
          const total = matching.length;
          const present = matching.filter((r: any) => r.status === "present").length;
          return {
            subject: s.name,
            percentage: total > 0 ? Math.round((present / total) * 100) : 100
          };
        });
        setDynamicSubjectAttendance(newSubjectData);

        // Fetch today's day order from academicCalendar
        let dayOrder = "I";
        let workingDay = true;
        try {
          const calSnap = await getDoc(doc(db, "academicCalendar", today));
          if (calSnap.exists()) {
            const calData = calSnap.data();
            if (calData.dayOrder && DAY_ORDER_MAP[calData.dayOrder] !== undefined) {
              dayOrder = calData.dayOrder;
            }
            if (calData.isWorkingDay !== undefined) {
              workingDay = calData.isWorkingDay;
            }
          } else {
            // Automatically determine Day Order by weekday if calendar entry not yet created
            const dayOfWeek = new Date().getDay(); // 0 is Sunday
            if (dayOfWeek === 0) {
              workingDay = false;
              dayOrder = "Sunday";
            } else {
              const dayOrders = ["I", "II", "III", "IV", "V", "VI"];
              dayOrder = dayOrders[dayOfWeek - 1] || "I";
            }
          }
        } catch (e) {
          console.error("Error fetching academicCalendar:", e);
        }

        if (!workingDay) {
          setIsHoliday(true);
          setDayOrderLabel(dayOrder === "Sunday" ? "Weekend (Sunday)" : "Holiday");
          setTimetable([]);
          return;
        }

        setIsHoliday(false);
        const dayIndex = DAY_ORDER_MAP[dayOrder] ?? 0;
        setDayOrderLabel(`Day Order ${dayOrder}`);

        // Use Firestore timetable slots for this day, or fallback to mock schedule
        let todaySlots: any[] = [];
        if (timetableDays[dayIndex]?.slots) {
          todaySlots = timetableDays[dayIndex].slots;
        } else if (weeklyTimetable[dayIndex]?.slots) {
          todaySlots = weeklyTimetable[dayIndex].slots;
        }

        // Filter by date in memory to avoid needing a composite index in Firestore
        const attendanceRecords = allRecords.filter(r => r.date === today);
        
        const mappedTimetable = todaySlots.map((slot: any, idx: number) => {
          const period = slot.period || (idx + 1);
          const record = attendanceRecords.find((r: any) => r.period === period);
          return {
            period,
            time: slot.time || "10:00 - 11:00",
            subject: slot.subject || "Free Period",
            room: "Class Room",
            faculty: slot.faculty || "Not Assigned",
            status: record ? record.status : "upcoming"
          };
        });
        
        setTimetable(mappedTimetable);
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
      <FeedbackBanner />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting}
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
        <StatCard title="Classes Attended Today" value={attended.toString()} hint={`out of ${timetable.length || 5}`} icon={<CalendarCheck className="h-5 w-5" />} accent="green" />
        <StatCard title="Classes Missed Today" value={missed.toString()} hint={`out of ${timetable.length || 5}`} icon={<CalendarX className="h-5 w-5" />} accent="red" />
        <StatCard title="Subjects" value={(subjectCount || 7).toString()} hint="This semester" icon={<BookOpen className="h-5 w-5" />} accent="yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Today's Timetable <span className="text-muted-foreground ml-2 text-sm font-normal">{dayOrderLabel}</span></h3>
            <Link href="/student/timetable" className="text-sm text-primary hover:underline">View full timetable</Link>
          </div>
          <div className="space-y-2">
            {isHoliday && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-muted/20">
                Today is marked as a Holiday.
              </div>
            )}
            {!isHoliday && timetable.map((row) => (
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
          <Heatmap data={makeHeatmap()} />
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