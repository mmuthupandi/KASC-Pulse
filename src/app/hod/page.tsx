"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  GraduationCap, 
  Percent, 
  Clock, 
  AlertTriangle, 
  Check, 
  X, 
  ArrowRight,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from "recharts";
import { 
  hodUser, 
  departmentClasses, 
  hodPendingApprovals, 
  condonationCandidates 
} from "@/lib/mock-data";
import { toast } from "sonner";

export default function Page() {
  return <HodDashboard />;
}

function HodDashboard() {
  const [approvals, setApprovals] = useState(hodPendingApprovals);

  const handleAction = (id: string, action: "Approved" | "Rejected", student: string) => {
    toast.success(`${student}'s request has been ${action.toLowerCase()} successfully.`);
    setApprovals(prev => prev.filter(req => req.id !== id));
  };

  // Find department avg attendance
  const totalStudents = departmentClasses.reduce((acc, c) => acc + c.strength, 0);
  const avgAttendance = (
    departmentClasses.reduce((acc, c) => acc + c.avgAttendance * c.strength, 0) / totalStudents
  ).toFixed(1);

  // Detained count (avg attendance below 75%)
  const lowAttendanceClasses = departmentClasses.filter(c => c.avgAttendance < 75);

  const chartColors = departmentClasses.map(c => 
    c.avgAttendance >= 85 
      ? "var(--color-primary)" 
      : c.avgAttendance >= 75 
        ? "var(--color-secondary)" 
        : "var(--color-destructive)"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome back, {hodUser.name.split(" ")[0]}! 👔
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Head of {hodUser.department} Department · stream: {hodUser.stream}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          title="Dept. Avg Attendance" 
          value={`${avgAttendance}%`} 
          hint="All year groups combined" 
          icon={<Percent className="h-5 w-5" />} 
          accent="green" 
        />
        <StatCard 
          title="Pending OD & Leave" 
          value={String(approvals.length)} 
          hint="Needs immediate action" 
          icon={<Clock className="h-5 w-5" />} 
          accent="orange" 
        />
        <StatCard 
          title="Condonation Candidates" 
          value={String(condonationCandidates.length)} 
          hint="65% - 74% attendance range" 
          icon={<GraduationCap className="h-5 w-5" />} 
          accent="yellow" 
        />
        <StatCard 
          title="Attendance Alerts" 
          value={String(lowAttendanceClasses.length)} 
          hint="Sections with <75% avg" 
          icon={<AlertTriangle className="h-5 w-5" />} 
          accent="red" 
        />
      </div>

      {/* Main Analytics & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Class Attendance Bar Chart */}
        <Card className="p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Class-wise Attendance</h3>
              <p className="text-xs text-muted-foreground">Emerald: Eligible (&gt;85%), Teal: Alert zone (75-85%), Red: Action required (&lt;75%)</p>
            </div>
            <Link href="/hod/logs" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Logs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentClasses} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tickFormatter={(val) => val.split(" ").slice(0, 2).join(" ") + " " + val.split(" ").slice(-1)}
                  className="text-[10px] sm:text-xs" 
                />
                <YAxis domain={[50, 100]} className="text-xs" />
                <Tooltip formatter={(value) => [`${value}%`, 'Avg Attendance']} />
                <Bar dataKey="avgAttendance" radius={[6, 6, 0, 0]}>
                  {departmentClasses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dynamic Class Section Alerts */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Critical Notifications</h3>
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive">
              Action Required
            </Badge>
          </div>
          <div className="space-y-3">
            {lowAttendanceClasses.map((cls) => (
              <div key={cls.id} className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-xs text-destructive">{cls.name}</div>
                  <Badge variant="destructive" className="text-[10px] py-0">{cls.avgAttendance}%</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Section average has fallen below the 75% KASC eligibility threshold. Parents must be notified.
                </div>
              </div>
            ))}
            {lowAttendanceClasses.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-10">
                🎉 All class sections are performing within acceptable attendance averages.
              </div>
            )}
            
            <div className="pt-2 border-t flex flex-col gap-2">
              <Button asChild size="sm" variant="outline" className="w-full justify-between rounded-xl">
                <Link href="/hod/condonation">
                  Verify Condonation Candidates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Approvals Queue */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Pending Leave & OD Approvals</h3>
            <p className="text-xs text-muted-foreground">Ensure verifying certificates before granting Academic On-Duty (OD)</p>
          </div>
          <Link href="/hod/approvals" className="text-sm text-primary hover:underline">
            View All Approvals
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {approvals.slice(0, 4).map((req) => (
            <div key={req.id} className="flex flex-col justify-between rounded-xl border p-4 transition hover:bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-sm block">{req.studentName}</span>
                    <span className="text-xs text-muted-foreground">{req.rollNo} · {req.class}</span>
                  </div>
                  <Badge 
                    className={
                      req.type === "OD" 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                    }
                    variant="secondary"
                  >
                    {req.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  <strong>Reason:</strong> {req.reason}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {req.duration}
                </div>
                {req.attachment && (
                  <div className="flex items-center gap-1 text-[11px] text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{req.attachment}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8"
                  onClick={() => handleAction(req.id, "Approved", req.studentName)}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 rounded-xl h-8"
                  onClick={() => handleAction(req.id, "Rejected", req.studentName)}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
          
          {approvals.length === 0 && (
            <div className="col-span-2 text-sm text-muted-foreground text-center py-8">
              👍 All leave and OD applications have been reviewed.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
