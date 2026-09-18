"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { CheckCircle2, XCircle, Save, Search, Loader2, Lock } from "lucide-react";
import { students as mockStudents } from "@/lib/mock-data";
import { db } from "@/lib/firebase";
import { writeBatch, doc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";
import { weeklyTimetable } from "@/lib/mock-data";

// ─── Subject catalogue (single source of truth) ───────────────────────────────
const ALL_SUBJECTS = [
  { code: "24USC506", name: "Operating Systems",                short: "OS" },
  { code: "24USC505", name: "Software Engineering & Testing",   short: "SE" },
  { code: "24USC5E1", name: "Cloud Computing (Major Elective)", short: "CC" },
  { code: "24USC507", name: "Database Management System",       short: "DBMS" },
  { code: "24USC5CP", name: "DBMS Lab",                        short: "Lab" },
  { code: "EDC",      name: "Extra Departmental Course (EDC)",  short: "EDC" },
];

// Period timing labels
const PERIOD_TIMES: Record<number, string> = {
  1: "10:00 AM – 11:00 AM",
  2: "11:00 AM – 12:00 PM",
  3: "12:00 PM – 01:00 PM",
  4: "02:00 PM – 03:00 PM",
  5: "03:00 PM – 04:00 PM",
};

type Status = "present" | "absent";

interface StudentRow {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  marked: Status;
}

export default function Page() { return <TakeAttendance />; }

function TakeAttendance() {
  const { user } = useAuth();

  // ─── Derive allowed subjects from user.subjects ──────────────────────────
  const allowedSubjects = useMemo(() => {
    if (!user) return [];
    // Tutors and admins can access all subjects
    if (user.isTutor || user.role === "admin") return ALL_SUBJECTS;
    if (!user.subjects?.length) return [];
    return ALL_SUBJECTS.filter((s) => user.subjects!.includes(s.code));
  }, [user]);

  // ─── Derive allowed periods for a given subject from the timetable ───────
  function allowedPeriodsForSubject(subjectCode: string): number[] {
    if (!user) return [];
    if (user.isTutor || user.role === "admin") return [1, 2, 3, 4, 5];
    const periods = new Set<number>();
    weeklyTimetable.forEach((day) => {
      day.slots.forEach((slot, idx) => {
        if (slot.code === subjectCode) {
          // idx is 0-based, period is 1-based
          periods.add(idx + 1);
        }
      });
    });
    return Array.from(periods).sort();
  }

  // ─── Form state ───────────────────────────────────────────────────────────
  const defaultSubject = allowedSubjects[0]?.code ?? "";
  const [subjectCode, setSubjectCode] = useState(defaultSubject);
  const [period, setPeriod] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classId] = useState(user?.classId || "b"); // Default to b if no classId

  // Keep subject in sync when allowedSubjects loads
  useEffect(() => {
    if (!subjectCode && allowedSubjects.length > 0) {
      setSubjectCode(allowedSubjects[0].code);
    }
  }, [allowedSubjects, subjectCode]);

  // Keep period in sync when subject changes
  const allowedPeriods = useMemo(
    () => allowedPeriodsForSubject(subjectCode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjectCode, user]
  );
  useEffect(() => {
    if (allowedPeriods.length > 0 && !allowedPeriods.includes(Number(period))) {
      setPeriod(String(allowedPeriods[0]));
    }
  }, [allowedPeriods, period]);

  // ─── Students + attendance ────────────────────────────────────────────────
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  useEffect(() => {
    if (!subjectCode || !period || !date) return;
    let cancelled = false;

    async function load() {
      setFetching(true);
      try {
        // 1. Fetch real students
        let studentList: StudentRow[] = [];
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        );
        studentList = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Unknown",
            rollNo: data.rollNo || data.email?.split("@")[0].toUpperCase() || "—",
            department: data.department || "B.Sc CS",
            marked: "present" as Status,
          };
        }).sort((a, b) => a.rollNo.localeCompare(b.rollNo));

        // 2. Load existing attendance for this slot
        const attSnap = await getDocs(
          query(
            collection(db, "attendance"),
            where("date", "==", date),
            where("period", "==", parseInt(period)),
            where("classId", "==", classId),
            where("subjectCode", "==", subjectCode)
          )
        );
        const records = attSnap.docs.map((d) => d.data());
        studentList = studentList.map((s) => {
          const rec = records.find((r) => r.studentId === s.id);
          return rec ? { ...s, marked: rec.status as Status } : s;
        });

        if (!cancelled) setRows(studentList);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Failed to load students");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [date, period, classId, subjectCode]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const setStatus = (id: string, status: Status) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, marked: status } : row)));
  const markAllPresent = () => setRows((r) => r.map((row) => ({ ...row, marked: "present" })));

  const filtered = rows.filter((r) => {
    const matchQ = r.name.toLowerCase().includes(q.toLowerCase()) || r.rollNo.toLowerCase().includes(q.toLowerCase());
    const matchF = filter === "all" || r.marked === filter;
    return matchQ && matchF;
  });

  const present = rows.filter((r) => r.marked === "present").length;
  const absent  = rows.filter((r) => r.marked === "absent").length;
  const pct = rows.length > 0 ? Math.round((present / rows.length) * 100) : 0;

  const selectedSubject = ALL_SUBJECTS.find((s) => s.code === subjectCode);

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user) { toast.error("Not logged in"); return; }
    if (!subjectCode) { toast.error("No subject selected"); return; }
    setSaving(true);
    try {
      const batch = writeBatch(db);
      rows.forEach((row) => {
        const docId = `${date}_${period}_${classId}_${subjectCode}_${row.id}`;
        batch.set(doc(db, "attendance", docId), {
          date,
          period: parseInt(period),
          classId,
          subjectCode,
          subjectName: selectedSubject?.name ?? subjectCode,
          studentId: row.id,
          studentName: row.name,
          status: row.marked,
          facultyId: user.uid,
          facultyName: user.name ?? "",
          timestamp: new Date().toISOString(),
        });
      });
      await batch.commit();
      toast.success("Attendance saved", { description: `${present} present · ${absent} absent` });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  // ─── No subjects assigned guard ───────────────────────────────────────────
  if (user && !user.isTutor && user.role !== "admin" && allowedSubjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">No subjects assigned</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ask your administrator to assign subjects to your account from the<br />
            Admin → Assign Subjects page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Take / Edit Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.isTutor
            ? "Class Tutor — full access to all subjects and periods."
            : `Showing only your assigned subject${allowedSubjects.length !== 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* Controls */}
      <Card className="p-5 relative overflow-hidden">
        {fetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectCode} onValueChange={setSubjectCode} disabled={fetching}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {allowedSubjects.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    <span className="font-medium">{s.short}</span>
                    <span className="text-muted-foreground text-xs ml-2 hidden sm:inline">{s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period — only allowed periods shown */}
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={setPeriod} disabled={fetching}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(user?.isTutor || user?.role === "admin" ? [1,2,3,4,5] : allowedPeriods).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    Period {p} — {PERIOD_TIMES[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" disabled={fetching} />
          </div>

          {/* Class info (read-only for now) */}
          <div className="space-y-2">
            <Label>Class</Label>
            <div className="flex h-10 items-center rounded-xl border bg-muted/40 px-3 text-sm text-muted-foreground">
              III B.Sc. CS (Un-Aided)
            </div>
          </div>
        </div>

        {/* Subject badge */}
        {selectedSubject && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-mono">{selectedSubject.code}</Badge>
            <span>{selectedSubject.name}</span>
            {user?.isTutor && <Badge className="bg-primary/10 text-primary border-primary/20">Class Tutor</Badge>}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Present" value={present} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard title="Absent"  value={absent}  icon={<XCircle className="h-5 w-5" />}      accent="red" />
        <StatCard title="Attendance %" value={`${pct}%`} hint={`of ${rows.length} students`}  accent="primary" />
      </div>

      {/* Table */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="h-10 w-64 rounded-xl pl-9" />
            </div>
            <div className="flex bg-muted/50 p-1 rounded-xl gap-1">
              {(["all", "present", "absent"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-lg h-8 px-4 capitalize ${
                    filter === f && f === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                    filter === f && f === "absent"  ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                  }`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "present" ? "P" : "A"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={markAllPresent} disabled={fetching}>
              Mark All Present
            </Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving || fetching}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Attendance
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {fetching ? "Loading…" : "No students found."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="hidden sm:table-cell"><Checkbox /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {s.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[140px] sm:max-w-none">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm" variant="outline"
                      className={`h-8 w-10 rounded-lg ${s.marked === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" : ""}`}
                      onClick={() => setStatus(s.id, "present")}
                      disabled={fetching}
                    >P</Button>
                    <Button
                      size="sm" variant="outline"
                      className={`h-8 w-10 rounded-lg ${s.marked === "absent" ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent" : ""}`}
                      onClick={() => setStatus(s.id, "absent")}
                      disabled={fetching}
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
