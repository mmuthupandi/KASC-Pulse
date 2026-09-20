"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Users, GraduationCap, BookOpen, Percent, Building2 } from "lucide-react";
import { FeedbackBanner } from "@/components/feedback-banner";
import { getDynamicGreeting } from "@/lib/utils";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { weeklyTimetable } from "@/lib/mock-data";

const COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "var(--color-primary)",
];

export default function Page() { return <AdminDashboard />; }

function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, faculty: 0, avgAttendance: 0, depts: 0, subjects: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [greeting, setGreeting] = useState("Admin Dashboard");

  useEffect(() => {
    if (user?.name) {
      setGreeting(getDynamicGreeting(user.name.split(" ")[0] || "Admin"));
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    
    async function loadStats() {
      try {
        const studentSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        const facultySnap = await getDocs(query(collection(db, "users"), where("role", "==", "faculty")));
        
        const depts = new Set<string>();
        studentSnap.docs.forEach(d => {
          if (d.data().department) depts.add(d.data().department);
        });

        const activeSubjects = new Set<string>();
        weeklyTimetable.forEach(day => {
          day.slots.forEach(slot => {
            if (slot.subject && slot.subject !== "—") activeSubjects.add(slot.subject);
          });
        });

        const attendanceSnap = await getDocs(query(collection(db, "attendance")));
        const records = attendanceSnap.docs.map(d => d.data());
        
        let presentCount = 0;
        const trendMap = new Map<string, { total: number; present: number }>();
        const deptAttMap = new Map<string, { total: number; present: number }>();
        const subjectAttMap = new Map<string, { total: number; present: number; group: string }>();

        records.forEach(r => {
          if (r.status === "present") presentCount++;
          
          // Trend
          if (r.date) {
            const dateStr = new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            if (!trendMap.has(dateStr)) trendMap.set(dateStr, { total: 0, present: 0 });
            const td = trendMap.get(dateStr)!;
            td.total++;
            if (r.status === "present") td.present++;
          }
          
          // Dept
          if (r.department) {
            if (!deptAttMap.has(r.department)) deptAttMap.set(r.department, { total: 0, present: 0 });
            const dd = deptAttMap.get(r.department)!;
            dd.total++;
            if (r.status === "present") dd.present++;
          }
          
          // Alerts (by subject/class)
          if (r.subjectCode) {
             const key = r.subjectCode;
             if (!subjectAttMap.has(key)) subjectAttMap.set(key, { total: 0, present: 0, group: r.classId || "Unknown Class" });
             const sd = subjectAttMap.get(key)!;
             sd.total++;
             if (r.status === "present") sd.present++;
          }
        });

        const avgAttendance = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

        const generatedTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
          day: date,
          value: Math.round((data.present / data.total) * 100)
        })).slice(-14); // last 14 days

        const generatedDeptData = Array.from(deptAttMap.entries()).map(([name, data]) => ({
          name,
          value: Math.round((data.present / data.total) * 100)
        }));

        const generatedAlerts = Array.from(subjectAttMap.entries())
          .map(([subj, data]) => ({
             s: subj,
             g: data.group,
             v: Math.round((data.present / data.total) * 100)
          }))
          .filter(a => a.v < 75)
          .slice(0, 5);

        setTrendData(generatedTrend);
        setDeptData(generatedDeptData);
        setAlerts(generatedAlerts);

        setStats({
          students: studentSnap.size,
          faculty: facultySnap.size,
          avgAttendance,
          depts: depts.size || 1, // fallback if empty
          subjects: activeSubjects.size || 0
        });
      } catch (error) {
        console.error("Failed to load admin stats", error);
      } finally {
        setFetchingStats(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading || !user) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in your institute.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Students" value={fetchingStats ? "..." : String(stats.students)} hint="Enrolled" icon={<GraduationCap className="h-5 w-5" />} accent="red" />
        <StatCard title="Total Faculty" value={fetchingStats ? "..." : String(stats.faculty)} hint="Active" icon={<Users className="h-5 w-5" />} accent="orange" />
        <StatCard title="Avg. Attendance" value={fetchingStats ? "..." : `${stats.avgAttendance}%`} hint="Overall" icon={<Percent className="h-5 w-5" />} accent="green" />
        <StatCard title="Subjects" value={fetchingStats ? "..." : String(stats.subjects)} hint="Active subjects" icon={<BookOpen className="h-5 w-5" />} accent="teal" />
        <StatCard title="Departments" value={fetchingStats ? "..." : String(stats.depts)} hint="Active" icon={<Building2 className="h-5 w-5" />} accent="magenta" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Attendance Overview</h3>
          <div className="h-72">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                Not enough data yet.
              </div>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">By Department</h3>
          <div className="h-72">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {deptData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                No departmental attendance data.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Low Attendance Alerts</h3>
          <span className="text-xs text-muted-foreground">Below 75%</span>
        </div>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="font-medium">{a.s}</div>
                  <div className="text-xs text-muted-foreground">{a.g}</div>
                </div>
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" variant="secondary">{a.v}%</Badge>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic py-4 text-center border border-dashed rounded-xl">No low attendance alerts at this time.</div>
          )}
        </div>
      </Card>
    </div>
  );
}