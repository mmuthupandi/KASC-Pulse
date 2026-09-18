"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { CalendarCheck, CalendarX, Percent, Loader2 } from "lucide-react";
import { Heatmap } from "@/components/heatmap";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { HeatCell } from "@/lib/mock-data";

export default function Page() { return <AttendancePage />; }

function AttendancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [fetching, setFetching] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0, total: 0 });
  const [days, setDays] = useState<any[]>([]);
  const [heatmapGrid, setHeatmapGrid] = useState<HeatCell[][]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    
    async function loadData() {
      try {
        const q = query(collection(db, "attendance"), where("studentId", "==", user?.uid));
        const snap = await getDocs(q);
        const records = snap.docs.map(doc => doc.data());
        
        let p = 0, a = 0;
        records.forEach(r => {
          if (r.status === "present") p++;
          if (r.status === "absent") a++;
        });
        setStats({ present: p, absent: a, leave: 0, total: p + a });
        
        // Prepare current month calendar (e.g., current month)
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
        
        const calendar = [];
        for (let i = 0; i < firstDay; i++) {
          calendar.push({ day: null, status: "none", dateStr: "" });
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
          const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dow = new Date(year, month, d).getDay();
          if (dow === 0 || dow === 6) {
            calendar.push({ day: d, status: "none", dateStr: dStr });
          } else {
            // Check records for this date
            const dayRecords = records.filter(r => r.date === dStr);
            let status = "none";
            if (dayRecords.length > 0) {
              const presentCount = dayRecords.filter(r => r.status === "present").length;
              status = presentCount >= (dayRecords.length / 2) ? "present" : "absent";
            }
            calendar.push({ day: d, status, dateStr: dStr });
          }
        }
        setDays(calendar);

        // Prepare heatmap grid (last 26 weeks)
        const weeks = 26;
        const rows = 7;
        const grid: HeatCell[][] = [];
        const start = new Date();
        start.setDate(start.getDate() - weeks * 7);
        
        for (let r = 0; r < rows; r++) {
          const row: HeatCell[] = [];
          for (let w = 0; w < weeks; w++) {
            const d = new Date(start);
            d.setDate(start.getDate() + w * 7 + r);
            const day = d.getDay();
            const dStr = d.toISOString().slice(0, 10);
            
            let status: HeatCell["status"] = "none";
            if (day !== 0 && day !== 6) {
              const dayRecords = records.filter(rec => rec.date === dStr);
              if (dayRecords.length > 0) {
                const presentCount = dayRecords.filter(rec => rec.status === "present").length;
                status = presentCount >= (dayRecords.length / 2) ? "present" : "absent";
              }
            }
            row.push({ date: dStr, status });
          }
          grid.push(row);
        }
        setHeatmapGrid(grid);

      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setFetching(false);
      }
    }
    
    loadData();
  }, [user]);

  const color = (s: string) =>
    s === "present"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      : s === "absent"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
        : s === "leave"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          : "bg-transparent text-muted-foreground";

  if (loading || !user || fetching) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const attendancePct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monthly calendar view and detailed statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Overall Attendance" value={`${attendancePct}%`} hint={`${stats.present} present · ${stats.absent} absent`} icon={<Percent className="h-5 w-5" />} accent="teal" />
        <StatCard title="Total Present" value={String(stats.present)} hint="Periods attended" icon={<CalendarCheck className="h-5 w-5" />} accent="green" />
        <StatCard title="Total Missed" value={String(stats.absent)} hint="Periods absent" icon={<CalendarX className="h-5 w-5" />} accent="red" />
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">{monthName}</h3>
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

      <Card className="p-5 overflow-hidden">
        <h3 className="mb-4 font-semibold">Semester Heatmap</h3>
        <Heatmap data={heatmapGrid} />
      </Card>
    </div>
  );
}