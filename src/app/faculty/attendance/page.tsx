"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import { CheckCircle2, XCircle, QrCode, Upload, Save, Search } from "lucide-react";
import { students } from "@/lib/mock-data";

type Status = "present" | "absent";

export default function Page() { return <TakeAttendance />; }

function TakeAttendance() {
  const [rows, setRows] = useState(students.map((s) => ({ ...s, marked: (s.status === "late" ? "present" : s.status) as Status })));
  const [q, setQ] = useState("");

  const setStatus = (id: number, status: Status) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, marked: status } : row)));
  const markAllPresent = () => setRows((r) => r.map((row) => ({ ...row, marked: "present" })));

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.rollNo.toLowerCase().includes(q.toLowerCase()));
  const present = rows.filter((r) => r.marked === "present").length;
  const absent = rows.filter((r) => r.marked === "absent").length;
  const pct = Math.round((present / rows.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Take Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mark attendance for your class in seconds.</p>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select defaultValue="ds">
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ds">Data Structures (CS-201)</SelectItem>
                <SelectItem value="os">Operating Systems (CS-202)</SelectItem>
                <SelectItem value="db">Database Management (CS-203)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select defaultValue="a">
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">B.Tech CS · 3rd Sem A</SelectItem>
                <SelectItem value="b">B.Tech CS · 3rd Sem B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" defaultValue="2024-05-21" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input defaultValue="09:00 AM - 10:00 AM" className="rounded-xl" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Present" value={present} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard title="Absent" value={absent} icon={<XCircle className="h-5 w-5" />} accent="red" />
        <StatCard title="Attendance %" value={`${pct}%`} hint={`of ${rows.length} students`} accent="primary" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="h-10 w-64 rounded-xl pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={markAllPresent}>Mark All Present</Button>
            <Button variant="outline" className="rounded-xl"><Upload className="mr-2 h-4 w-4" />Upload Excel</Button>
            <Button variant="outline" className="rounded-xl"><QrCode className="mr-2 h-4 w-4" />QR Code</Button>
            <Button
              className="rounded-xl"
              onClick={() => toast.success("Attendance saved", { description: `${present} present · ${absent} absent` })}
            >
              <Save className="mr-2 h-4 w-4" />Save Attendance
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 hidden sm:table-cell"><Checkbox /></TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Reg No.</TableHead>
              <TableHead className="text-right">Mark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="hidden sm:table-cell"><Checkbox /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={s.avatar} /><AvatarFallback>{s.name.slice(0,2)}</AvatarFallback></Avatar>
                    <span className="font-medium truncate max-w-[120px] sm:max-w-none">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={`h-8 w-10 rounded-lg transition-colors ${s.marked === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" : ""}`} 
                      onClick={() => setStatus(s.id, "present")}
                    >P</Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={`h-8 w-10 rounded-lg transition-colors ${s.marked === "absent" ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent" : ""}`} 
                      onClick={() => setStatus(s.id, "absent")}
                    >A</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}