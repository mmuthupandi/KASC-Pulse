"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Upload, Download, Trash2, Pencil, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export function StudentsTable() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data(), attendance: 0 })); // Attendance can be fetched separately if needed
        setStudents(data);
      } catch (err) {
        toast.error("Failed to fetch students");
      } finally {
        setFetching(false);
      }
    }
    fetchStudents();
  }, []);

  const perPage = 8;

  const filtered = students.filter(
    (s) =>
      (dept === "all" || s.department === dept) &&
      (s.name.toLowerCase().includes(q.toLowerCase()) || s.rollNo.toLowerCase().includes(q.toLowerCase())),
  );
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="h-10 w-64 rounded-xl pl-9" />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="h-10 w-48 rounded-xl"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl"><Upload className="mr-2 h-4 w-4" />Import</Button>
          <Button variant="outline" className="rounded-xl"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button className="rounded-xl" onClick={() => toast.success("Add student")}><Plus className="mr-2 h-4 w-4" />Add Student</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><Checkbox /></TableHead>
            <TableHead>Roll No.</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Sem</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((s) => (
            <TableRow key={s.id}>
              <TableCell><Checkbox /></TableCell>
              <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback>{s.name?.slice(0,2) || "?"}</AvatarFallback></Avatar>
                  <span className="font-medium">{s.name}</span>
                </div>
              </TableCell>
              <TableCell>{s.department}</TableCell>
              <TableCell>{s.semester}</TableCell>
              <TableCell>{s.section}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${s.attendance >= 85 ? "bg-emerald-500" : s.attendance >= 75 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${s.attendance}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.attendance}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" className="rounded-lg"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
          {fetching && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell>
            </TableRow>
          )}
          {!fetching && paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No students found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Showing {paged.length} of {filtered.length}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Badge variant="secondary">Page {page} of {totalPages}</Badge>
          <Button variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </Card>
  );
}