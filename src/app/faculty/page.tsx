"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Users, ClipboardCheck, Percent, BookOpen, QrCode, Upload } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { attendanceTrend } from "@/lib/mock-data";

export default function Page() { return <FacultyDashboard />; }

function FacultyDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Welcome, Prof. Verma</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in your classes today.</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/faculty/attendance"><ClipboardCheck className="mr-2 h-4 w-4" />Take Attendance</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Classes Today" value="4" hint="Next: 10:00 AM" icon={<BookOpen className="h-5 w-5" />} accent="teal" />
        <StatCard title="Total Students" value="180" hint="Across 3 sections" icon={<Users className="h-5 w-5" />} accent="magenta" />
        <StatCard title="Avg. Attendance" value="87%" hint="This month" icon={<Percent className="h-5 w-5" />} accent="green" />
        <StatCard title="Pending Reports" value="2" hint="Due this week" icon={<ClipboardCheck className="h-5 w-5" />} accent="orange" />
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
              <Link href="/faculty/attendance"><QrCode className="mr-2 h-4 w-4" />Generate QR Code</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-xl">
              <Upload className="mr-2 h-4 w-4" />Upload Excel
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl">
              <Link href="/faculty/students"><Users className="mr-2 h-4 w-4" />View Students</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}