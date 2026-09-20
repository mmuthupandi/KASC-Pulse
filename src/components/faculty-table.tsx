"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Upload, Download, Trash2, Pencil, Loader2, ShieldCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export function FacultyTable() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [page, setPage] = useState(1);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchFaculty() {
      try {
        const q = query(collection(db, "users"), where("role", "==", "faculty"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFaculty(data);
      } catch (err) {
        toast.error("Failed to fetch faculty");
      } finally {
        setFetching(false);
      }
    }
    fetchFaculty();
  }, []);

  const perPage = 8;

  const filtered = faculty.filter(
    (f) =>
      (dept === "all" || f.department === dept) &&
      (f.name?.toLowerCase().includes(q.toLowerCase()) || f.email?.toLowerCase().includes(q.toLowerCase())),
  );
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search faculty..." className="h-10 w-64 rounded-xl pl-9" />
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
          <Button className="rounded-xl" onClick={() => toast.success("Add faculty")}><Plus className="mr-2 h-4 w-4" />Add Faculty</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><Checkbox /></TableHead>
            <TableHead>Faculty</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((f) => (
            <TableRow key={f.id}>
              <TableCell><Checkbox /></TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback>{f.name?.slice(0,2).toUpperCase() || "?"}</AvatarFallback></Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{f.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{f.email || "—"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{f.department || "—"}</TableCell>
              <TableCell>
                {f.designation ? <Badge variant="outline">{f.designation}</Badge> : "—"}
              </TableCell>
              <TableCell>
                {f.isTutor ? <Badge className="bg-primary/10 text-primary hover:bg-primary/20"><ShieldCheck className="h-3 w-3 mr-1"/> Yes</Badge> : "No"}
              </TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" className="rounded-lg"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
          {fetching && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell>
            </TableRow>
          )}
          {!fetching && paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No faculty found.</TableCell>
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
