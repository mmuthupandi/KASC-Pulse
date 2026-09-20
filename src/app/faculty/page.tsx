"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { FeedbackBanner } from "@/components/feedback-banner";
import { getDynamicGreeting } from "@/lib/utils";

export default function Page() { return <FacultyDashboard />; }

function FacultyDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, avgAttendance: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back!");

  useEffect(() => {
    if (user?.name) {
      setGreeting(getDynamicGreeting(user.name.split(" ")[0] || "Faculty"));
    }
  }, [user]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"month" | "custom">("month");
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "faculty")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function loadStats() {
      if (!user) return;
      try {
        const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        const totalStudents = studentsSnap.size;

        let attQuery = query(collection(db, "attendance"));
        if (!user.isTutor && user.role !== "admin") {
          attQuery = query(collection(db, "attendance"), where("facultyId", "==", user.uid));
        }
        
        const attendanceSnap = await getDocs(attQuery);
        const records = attendanceSnap.docs.map(d => d.data());
        
        let present = 0;
        records.forEach(r => {
          if (r.status === "present") present++;
        });
        
        const avgAttendance = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
        setStats({ totalStudents, avgAttendance });

        // Compute 7-day trend
        const trend = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const displayStr = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
          
          const dayRecords = records.filter(r => r.date === dateStr);
          if (dayRecords.length > 0) {
            const pres = dayRecords.filter(r => r.status === "present").length;
            trend.push({ day: displayStr, value: Math.round((pres / dayRecords.length) * 100) });
          } else {
            trend.push({ day: displayStr, value: 0 });
          }
        }
        setTrendData(trend);
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
    if (exportType === "custom" && (!exportStart || !exportEnd)) {
      toast.error("Please select both start and end dates.");
      return;
    }
    
    setExporting(true);
    try {
      // Fetch all students to map IDs to Roll Nos
      const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
      const studentMap = new Map();
      studentsSnap.docs.forEach(doc => {
        const data = doc.data();
        studentMap.set(doc.id, {
          rollNo: data.rollNo || doc.id,
          name: data.name || "Unknown"
        });
      });

      // Fetch all attendance records
      const q = query(collection(db, "attendance"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("No attendance data found to export.");
        setExporting(false);
        return;
      }

      // Filter and group by student
      const records = querySnapshot.docs.map(doc => doc.data());
      const studentStats: Record<string, { present: number; name: string }> = {};
      const classSessions: Record<string, Set<string>> = {};
      const studentClassMap: Record<string, string> = {};

      records.forEach(r => {
        if (!r.date) return;
        
        // Date filtering logic
        if (exportType === "month") {
          if (!r.date.startsWith(exportMonth)) return;
        } else {
          if (r.date < exportStart || r.date > exportEnd) return;
        }
        
        const sId = r.studentId;
        const cId = r.classId || "unknown";
        
        studentClassMap[sId] = cId;
        
        if (!classSessions[cId]) {
          classSessions[cId] = new Set();
        }
        classSessions[cId].add(`${r.date}-${r.period}`);
        
        if (!studentStats[sId]) {
          studentStats[sId] = { 
            present: 0, 
            name: r.studentName || studentMap.get(sId)?.name || "Unknown"
          };
        }
        
        if (r.status === "present") {
          studentStats[sId].present += 1;
        }
      });

      // Format data for Excel
      const excelData = Object.keys(studentStats)
        .filter(sId => studentMap.has(sId)) // Only include students currently in the users collection
        .map(sId => {
        const stat = studentStats[sId];
        const cId = studentClassMap[sId];
        const totalWorkingDays = classSessions[cId]?.size || 0;
        const rollNo = studentMap.get(sId)?.rollNo || sId;
        
        const present = stat.present;
        const absent = totalWorkingDays - present;
        const percentage = totalWorkingDays > 0 ? ((present / totalWorkingDays) * 100).toFixed(2) : "0.00";
        
        return {
          "Reg No": rollNo,
          "Student Name": stat.name,
          "No of Working Days": totalWorkingDays,
          "No of Present": present,
          "No of Absent": absent,
          "Percentage %": Number(percentage)
        };
      });

      // Sort by Reg No correctly handling alphanumeric strings
      excelData.sort((a, b) => String(a["Reg No"]).localeCompare(String(b["Reg No"]), undefined, { numeric: true, sensitivity: 'base' }));

      if (excelData.length === 0) {
        toast.error(`No attendance records found for selected period.`);
        setExporting(false);
        setExportModalOpen(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = [
        { wch: 15 }, // Reg No
        { wch: 25 }, // Name
        { wch: 20 }, // Working Days
        { wch: 15 }, // Present
        { wch: 15 }, // Absent
        { wch: 15 }, // Percentage
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      const sheetName = exportType === "month" ? exportMonth : "Custom";
      const fileName = exportType === "month" ? `Monthly_Attendance_${exportMonth}.xlsx` : `Custom_Attendance_${exportStart}_to_${exportEnd}.xlsx`;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance_${sheetName}`);
      
      XLSX.writeFile(workbook, fileName);
      toast.success("Excel exported successfully!");
      setExportModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner />
      
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{greeting}</h1>
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
              <BarChart data={trendData}>
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
                onClick={() => setExportModalOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel (Tutor Only)
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full justify-start rounded-xl">
              <Link href="/faculty/students"><Users className="mr-2 h-4 w-4" />View Students</Link>
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Attendance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button 
                variant={exportType === "month" ? "default" : "outline"} 
                className="flex-1 rounded-xl"
                onClick={() => setExportType("month")}
              >
                Monthly Report
              </Button>
              <Button 
                variant={exportType === "custom" ? "default" : "outline"} 
                className="flex-1 rounded-xl"
                onClick={() => setExportType("custom")}
              >
                Custom Range
              </Button>
            </div>

            {exportType === "month" && (
              <div className="space-y-2">
                <Label>Select Month</Label>
                <Input 
                  type="month" 
                  value={exportMonth} 
                  onChange={(e) => setExportMonth(e.target.value)} 
                  className="rounded-xl h-11"
                />
              </div>
            )}

            {exportType === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={exportStart} 
                    onChange={(e) => setExportStart(e.target.value)} 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={exportEnd} 
                    onChange={(e) => setExportEnd(e.target.value)} 
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleExportExcel} disabled={exporting} className="rounded-xl">
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Download Excel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}