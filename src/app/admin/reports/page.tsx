"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Calendar as CalendarIcon, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export default function ReportsPage() {
  const download = async (type: string) => {
    toast.info(`Generating ${type} report...`);
    
    try {
      if (type === "Periodic") {
        const snap = await getDocs(query(collection(db, "attendance")));
        const records = snap.docs.map(d => d.data());
        
        let csv = "Date,Roll No,Subject,Status\n";
        records.forEach(r => {
          csv += `"${r.date || ''}","${r.studentRollNo || ''}","${r.subjectCode || ''}","${r.status || ''}"\n`;
        });
        
        triggerDownload(csv, "Periodic_Attendance_Report.csv");
        toast.success("Report downloaded.");
      } 
      else if (type === "Defaulters") {
        const snap = await getDocs(query(collection(db, "attendance")));
        const records = snap.docs.map(d => d.data());
        
        // Aggregate by student
        const stats: Record<string, { present: number; total: number; name: string }> = {};
        records.forEach(r => {
          const roll = r.studentRollNo;
          if (!roll) return;
          if (!stats[roll]) stats[roll] = { present: 0, total: 0, name: r.studentName || roll };
          stats[roll].total++;
          if (r.status === "present") stats[roll].present++;
        });
        
        let csv = "Roll No,Name,Attendance %,Present Classes,Total Classes\n";
        Object.entries(stats).forEach(([roll, data]) => {
          const pct = Math.round((data.present / data.total) * 100);
          if (pct < 75) {
            csv += `"${roll}","${data.name}",${pct}%,${data.present},${data.total}\n`;
          }
        });
        
        triggerDownload(csv, "Defaulters_List.csv");
        toast.success("Report downloaded.");
      }
      else if (type === "Analytics") {
        toast.info("Generating PDF... (Mocked for now)");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report.");
    }
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate and download attendance, condonation, and performance reports.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly/Monthly Report */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-4">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Periodic Attendance</h3>
            <p className="text-sm text-muted-foreground mt-1">Export daily, weekly, or monthly attendance logs for all classes.</p>
            
            <div className="mt-4 space-y-3">
              <Select defaultValue="month">
                <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Period" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => download("Periodic")} className="w-full mt-6 rounded-xl"><FileDown className="mr-2 h-4 w-4" /> Download Excel</Button>
        </Card>

        {/* Low Attendance / Condonation */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Defaulters List</h3>
            <p className="text-sm text-muted-foreground mt-1">Identify students with less than 75% attendance for condonation.</p>
            
            <div className="mt-4 space-y-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="cs">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => download("Defaulters")} variant="destructive" className="w-full mt-6 rounded-xl"><FileDown className="mr-2 h-4 w-4" /> Generate List</Button>
        </Card>

        {/* Aggregate Trends */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Department Analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">Export high-level department statistics and comparative charts.</p>
          </div>
          <Button onClick={() => download("Analytics")} variant="outline" className="w-full mt-6 rounded-xl"><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
        </Card>
      </div>
    </div>
  );
}
