"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import { CheckCircle2, XCircle, Save, Search, Loader2 } from "lucide-react";
import { students } from "@/lib/mock-data";
import { db } from "@/lib/firebase";
import { writeBatch, doc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

type Status = "present" | "absent";

export default function Page() { return <TakeAttendance />; }

function TakeAttendance() {
  const { user } = useAuth();
  const [dbStudents, setDbStudents] = useState<any[]>(students);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState("1");
  const [classId, setClassId] = useState("a");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  useEffect(() => {
    async function initData() {
      if (!date || !period || !classId) return;
      setFetching(true);

      let currentStudents: any[] = students;
      try {
        // Fetch real students from Firebase
        const qStudents = query(collection(db, "users"), where("role", "==", "student"));
        const snapStudents = await getDocs(qStudents);
        if (!snapStudents.empty) {
          const realStudents = snapStudents.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Unknown Student",
              rollNo: data.email ? data.email.split('@')[0].toUpperCase() : "NEW-STUDENT",
              department: data.department || "B.Sc CS",
              avatar: ""
            };
          });
          // Filter out mock students that have the same Reg No as a real student
          const filteredMockStudents = students.filter(
            mock => !realStudents.some(real => real.rollNo.toUpperCase() === mock.rollNo.toUpperCase())
          );

          // Put real students into the list and sort by Reg No
          currentStudents = [...realStudents, ...filteredMockStudents].sort((a, b) => 
            a.rollNo.localeCompare(b.rollNo)
          );
        }
      } catch (err) {
        console.error("Error fetching real students:", err);
      }
      
      setDbStudents(currentStudents);

      try {
        // Fetch attendance for the selected date
        const qAtt = query(
          collection(db, "attendance"),
          where("date", "==", date),
          where("period", "==", parseInt(period)),
          where("classId", "==", classId)
        );
        const snapshot = await getDocs(qAtt);
        
        if (!snapshot.empty) {
          const records = snapshot.docs.map(doc => doc.data());
          setRows(currentStudents.map(s => {
            const record = records.find(r => r.studentId === String(s.id));
            return { ...s, marked: (record?.status as Status) || "present" };
          }));
        } else {
          setRows(currentStudents.map(s => ({ ...s, marked: "present" })));
        }
      } catch (error) {
        console.error("Error fetching existing attendance", error);
      } finally {
        setFetching(false);
      }
    }

    initData();
  }, [date, period, classId]);

  const setStatus = (id: string | number, status: Status) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, marked: status } : row)));
  const markAllPresent = () => setRows((r) => r.map((row) => ({ ...row, marked: "present" })));

  const filtered = rows.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(q.toLowerCase()) || r.rollNo.toLowerCase().includes(q.toLowerCase());
    const matchesFilter = filter === "all" ? true : r.marked === filter;
    return matchesSearch && matchesFilter;
  });
  
  const present = rows.filter((r) => r.marked === "present").length;
  const absent = rows.filter((r) => r.marked === "absent").length;
  const pct = Math.round((present / rows.length) * 100);

  const handleSaveAttendance = async () => {
    if (!user) {
      toast.error("You must be logged in to save attendance.");
      return;
    }
    setSaving(true);
    try {
      const batch = writeBatch(db);
      rows.forEach(row => {
        const docId = `${date}_${period}_${classId}_${row.id}`;
        const docRef = doc(db, "attendance", docId);
        batch.set(docRef, {
          date,
          period: parseInt(period),
          classId,
          studentId: String(row.id),
          studentName: row.name,
          status: row.marked,
          facultyId: user.uid,
          timestamp: new Date().toISOString()
        });
      });
      await batch.commit();
      toast.success("Attendance saved successfully", { description: `${present} present · ${absent} absent` });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Take / Edit Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mark or modify attendance for any past date.</p>
      </div>

      <Card className="p-5 relative overflow-hidden">
        {fetching && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select defaultValue="os">
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="os">OS</SelectItem>
                <SelectItem value="set">Software Engineering and Testing</SelectItem>
                <SelectItem value="cc">Cloud Computing</SelectItem>
                <SelectItem value="dbms">DBMS</SelectItem>
                <SelectItem value="dbms_lab">DBMS Lab</SelectItem>
                <SelectItem value="edc">EDC (Extra Departmental Course)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">B.Tech CS · 3rd Sem A</SelectItem>
                <SelectItem value="b">B.Tech CS · 3rd Sem B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Period (1-5)</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Period 1 (10:00 AM)</SelectItem>
                <SelectItem value="2">Period 2 (11:00 AM)</SelectItem>
                <SelectItem value="3">Period 3 (12:00 PM)</SelectItem>
                <SelectItem value="4">Period 4 (02:00 PM)</SelectItem>
                <SelectItem value="5">Period 5 (03:00 PM)</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="h-10 w-64 rounded-xl pl-9" />
            </div>
            <div className="flex bg-muted/50 p-1 rounded-xl">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                className={`rounded-lg h-8 px-4 ${filter === "all" ? "bg-primary text-primary-foreground shadow-sm" : ""}`}
                onClick={() => setFilter("all")}
              >All</Button>
              <Button
                variant={filter === "present" ? "default" : "ghost"}
                size="sm"
                className={`rounded-lg h-8 px-4 ${filter === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : ""}`}
                onClick={() => setFilter("present")}
              >P</Button>
              <Button
                variant={filter === "absent" ? "default" : "ghost"}
                size="sm"
                className={`rounded-lg h-8 px-4 ${filter === "absent" ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm" : ""}`}
                onClick={() => setFilter("absent")}
              >A</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={markAllPresent} disabled={fetching}>Mark All Present</Button>
            <Button
              className="rounded-xl"
              onClick={handleSaveAttendance}
              disabled={saving || fetching}
            >
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
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="hidden sm:table-cell"><Checkbox /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-muted-foreground">{s.name.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
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
                      disabled={fetching}
                    >P</Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={`h-8 w-10 rounded-lg transition-colors ${s.marked === "absent" ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent" : ""}`} 
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