"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { students as mockStudents } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Lock, ShieldCheck } from "lucide-react";

const ALL_SUBJECTS: Record<string, string> = {
  "24USC506": "Operating Systems",
  "24USC505": "Software Engineering & Testing",
  "24USC5E1": "Cloud Computing",
  "24USC507": "Database Management System",
  "24USC5CP": "DBMS Lab",
  "EDC":      "Extra Departmental Course",
};

interface StudentRow {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  semester: string;
  stream: string;
  attendance: number;
}

export default function StudentsPage() {
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [q, setQ] = useState("");

  const isTutor = user?.isTutor ?? false;
  const isAdmin = user?.role === "admin";
  const hasAccess = isTutor || isAdmin;

  useEffect(() => {
    if (loading || !user) return;

    async function load() {
      setFetching(true);
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        );

        let list: StudentRow[] = [];
        if (!snap.empty) {
          const real = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || "Unknown",
              rollNo: data.rollNo || data.email?.split("@")[0].toUpperCase() || "—",
              department: data.department || "B.Sc. Computer Science",
              semester: data.semester || "—",
              stream: data.stream || "—",
              attendance: 0,
            };
          });
          const realRolls = new Set(real.map((r) => r.rollNo.toUpperCase()));
          const mockFilled = mockStudents
            .filter((m) => !realRolls.has(m.rollNo.toUpperCase()))
            .map((m) => ({
              id: String(m.id),
              name: m.name,
              rollNo: m.rollNo,
              department: m.department,
              semester: m.semester,
              stream: m.stream,
              attendance: m.attendance,
            }));
          list = [...real, ...mockFilled].sort((a, b) => a.rollNo.localeCompare(b.rollNo));
        } else {
          list = mockStudents.map((m) => ({
            id: String(m.id),
            name: m.name,
            rollNo: m.rollNo,
            department: m.department,
            semester: m.semester,
            stream: m.stream,
            attendance: m.attendance,
          }));
        }
        setStudents(list);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [user, loading]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(q.toLowerCase())
  );

  // ── Non-tutor, non-admin: no access ─────────────────────────────────────
  if (!loading && user && !hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student roster access</p>
        </div>
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Restricted Access</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Full student roster is only available to Class Tutors.<br />
              You can view student attendance via the{" "}
              <a href="/faculty/attendance" className="text-primary underline underline-offset-2">
                Take Attendance
              </a>{" "}
              page for your assigned subjects.
            </p>
          </div>
          {user.subjects && user.subjects.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {user.subjects.map((code) => (
                <Badge key={code} variant="secondary">
                  {ALL_SUBJECTS[code] ?? code}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All students — III B.Sc. Computer Science
          </p>
        </div>
        {isTutor && (
          <Badge className="flex items-center gap-1.5 bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Class Tutor
          </Badge>
        )}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or roll no…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {fetching ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Reg No.</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {s.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell className="text-sm">{s.semester}</TableCell>
                  <TableCell className="text-sm">{s.stream}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            s.attendance >= 85 ? "bg-emerald-500" :
                            s.attendance >= 75 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${s.attendance || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.attendance || 0}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
