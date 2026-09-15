"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Users, GraduationCap, BookOpen, Percent, Building2 } from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { attendanceTrend, departmentAttendance } from "@/lib/mock-data";

const COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "var(--color-primary)",
];

export default function Page() { return <AdminDashboard />; }

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back! Here's what's happening in your institute.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Students" value="1,248" hint="↑ 12 this month" icon={<GraduationCap className="h-5 w-5" />} accent="red" />
        <StatCard title="Total Faculty" value="87" hint="↑ 2 this month" icon={<Users className="h-5 w-5" />} accent="orange" />
        <StatCard title="Avg. Attendance" value="86.4%" hint="↑ 4.3%" icon={<Percent className="h-5 w-5" />} accent="green" />
        <StatCard title="Subjects" value="54" hint="Across 5 depts." icon={<BookOpen className="h-5 w-5" />} accent="teal" />
        <StatCard title="Departments" value="5" hint="Active" icon={<Building2 className="h-5 w-5" />} accent="magenta" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Attendance Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">By Department</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentAttendance} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {departmentAttendance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Low Attendance Alerts</h3>
          <span className="text-xs text-muted-foreground">Below 75%</span>
        </div>
        <div className="space-y-4">
          {[
            { s: "OS", g: "3rd Sem A", v: 72 },
            { s: "DBMS Lab", g: "1st Sem B", v: 68 },
            { s: "Cloud Computing", g: "5th Sem A", v: 74 },
          ].map((a) => (
            <div key={a.s} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <div className="font-medium">{a.s}</div>
                <div className="text-xs text-muted-foreground">{a.g}</div>
              </div>
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" variant="secondary">{a.v}%</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}