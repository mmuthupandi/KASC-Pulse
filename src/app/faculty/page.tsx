"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Users, ClipboardCheck, Percent, BookOpen, QrCode, Download, Loader2 } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { attendanceTrend } from "@/lib/mock-data";
import { useAuth } from "@/providers/AuthProvider";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Page() { return <FacultyDashboard />; }

function FacultyDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, avgAttendance: 0 });
  const [fetchingStats, setFetchingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "faculty")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function loadStats() {
      try {
        const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        const totalStudents = studentsSnap.size;

        const attendanceSnap = await getDocs(query(collection(db, "attendance")));
        const records = attendanceSnap.docs.map(d => d.data());
        
        let present = 0;
        records.forEach(r => {
          if (r.status === "present") present++;
        });
        
        const avgAttendance = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
        setStats({ totalStudents, avgAttendance });
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setFetchingStats(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading || !user) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Fetch all attendance records
      const q = query(collection(db, "attendance"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("No attendance data found to export.");
        setExporting(false);
        return;
      }

      const data = querySnapshot.docs.map(doc => doc.data());
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      
      XLSX.writeFile(workbook, `Attendance_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Welcome, {user.name || "Faculty"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in your classes today.</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/faculty/attendance"><ClipboardCheck className="mr-2 h-4 w-4" />Take Attendance</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Classes Today" value="5" hint="Periods 1 to 5" icon={<BookOpen className="h-5 w-5" />} accent="teal" />
        <StatCard title="Total Students" value={fetchingStats ? "..." : String(stats.totalStudents)} hint="Total enrolled" icon={<Users className="h-5 w-5" />} accent="magenta" />
        <StatCard title="Avg. Attendance" value={fetchingStats ? "..." : `${stats.avgAttendance}%`} hint="Overall" icon={<Percent className="h-5 w-5" />} accent="green" />
        <StatCard title="Pending Reports" value="0" hint="Due this week" icon={<ClipboardCheck className="h-5 w-5" />} accent="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Attendance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-secondary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start rounded-xl">
              <Link href="/faculty/attendance"><ClipboardCheck className="mr-2 h-4 w-4" />Mark Period Attendance</Link>
            </Button>
            
            {user.isTutor && (
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-xl border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export Excel (Tutor Only)
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full justify-start rounded-xl">
              <Link href="/faculty/students"><Users className="mr-2 h-4 w-4" />View Students</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}