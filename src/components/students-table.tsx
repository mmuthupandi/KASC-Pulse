"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  GraduationCap,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";

interface StudentItem {
  id: string;
  name: string;
  rollNo: string;
  email?: string;
  department?: string;
  semester?: string;
  section?: string;
  attendance: number;
  totalClasses: number;
}

const SEMESTERS = ["All", "1st", "2nd", "3rd", "4th", "5th", "6th"];
const DEPARTMENTS = [
  "All",
  "B.Sc. Computer Science",
  "BCA",
  "B.Sc. IT",
  "B.Com",
  "B.Sc. Mathematics",
];

export function StudentsTable() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [semFilter, setSemFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number | "All">(50); // Default to 50 so all 58 students show
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [fetching, setFetching] = useState(true);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetSem, setBulkTargetSem] = useState("6th");
  const [isBulkPromoting, setIsBulkPromoting] = useState(false);

  // Promote Entire Class Dialog
  const [isPromoteClassOpen, setIsPromoteClassOpen] = useState(false);
  const [promoteDept, setPromoteDept] = useState("B.Sc. Computer Science");
  const [promoteFromSem, setPromoteFromSem] = useState("5th");
  const [promoteToSem, setPromoteToSem] = useState("6th");
  const [isPromotingClass, setIsPromotingClass] = useState(false);

  // Edit Student Modal state
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRollNo, setEditRollNo] = useState("");
  const [editSemester, setEditSemester] = useState("6th");
  const [editSection, setEditSection] = useState("");
  const [editDepartment, setEditDepartment] = useState("B.Sc. Computer Science");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Add Student Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRollNo, setAddRollNo] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addSemester, setAddSemester] = useState("6th");
  const [addSection, setAddSection] = useState("A");
  const [addDepartment, setAddDepartment] = useState("B.Sc. Computer Science");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch and calculate attendance
  const fetchStudents = async () => {
    setFetching(true);
    try {
      const qUsers = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(qUsers);

      const attSnap = await getDocs(collection(db, "attendance"));
      const records = attSnap.docs.map((d) => d.data());

      // 1. Fetch subjects to map subjectCode -> semester
      const subSnap = await getDocs(collection(db, "subjects"));
      const subjectSemMap: Record<string, string> = {};
      subSnap.docs.forEach((d) => {
        const s = d.data();
        if (s.code && s.sem) {
          subjectSemMap[s.code.toUpperCase()] = s.sem.toLowerCase();
        }
      });

      const getRecordSem = (r: any): string => {
        if (r.semester) return r.semester.toLowerCase();
        const code = (r.subjectCode || "").toUpperCase();
        if (subjectSemMap[code]) return subjectSemMap[code];
        if (/24USC5/i.test(code)) return "5th";
        if (/24USC6/i.test(code)) return "6th";
        return "5th";
      };

      // 2. Index attendance by semester -> studentId
      const classSessionsBySem: Record<string, Record<string, Set<string>>> = {};
      const studentStatsBySem: Record<string, Record<string, { present: number }>> = {};
      const studentClassMap: Record<string, string> = {};

      records.forEach((r) => {
        if (!r.date || !r.studentId) return;
        const sId = r.studentId;
        const cId = r.classId || "unknown";
        const sem = getRecordSem(r);

        studentClassMap[sId] = cId;

        if (!classSessionsBySem[sem]) classSessionsBySem[sem] = {};
        if (!classSessionsBySem[sem][cId]) classSessionsBySem[sem][cId] = new Set();
        classSessionsBySem[sem][cId].add(`${r.date}-${r.period}`);

        if (!studentStatsBySem[sem]) studentStatsBySem[sem] = {};
        if (!studentStatsBySem[sem][sId]) studentStatsBySem[sem][sId] = { present: 0 };
        if (r.status === "present") studentStatsBySem[sem][sId].present++;
      });

      const data: StudentItem[] = snap.docs.map((d) => {
        const sId = d.id;
        const raw = d.data();
        const cId = studentClassMap[sId] || "unknown";
        const studentSem = (raw.semester || "6th").toLowerCase();

        // Calculate attendance ONLY for the student's active semester
        const totalWorkingDays = classSessionsBySem[studentSem]?.[cId]?.size || 0;
        const present = studentStatsBySem[studentSem]?.[sId]?.present || 0;

        let attendancePct = 0;
        if (totalWorkingDays > 0) {
          attendancePct = Math.round((present / totalWorkingDays) * 100);
        }

        return {
          id: sId,
          name: raw.name || "Unknown",
          rollNo: raw.rollNo || "",
          email: raw.email || "",
          department: raw.department || "B.Sc. Computer Science",
          semester: raw.semester || "6th",
          section: raw.section || "",
          attendance: attendancePct,
          totalClasses: totalWorkingDays,
        };
      });

      // SORT ALWAYS BY REGISTER NUMBER / ROLL NO (Natural Numeric Ordering)
      data.sort((a, b) =>
        (a.rollNo || "").localeCompare(b.rollNo || "", undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      setStudents(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students
  const filtered = students.filter((s) => {
    const matchesDept = dept === "All" || s.department?.toLowerCase() === dept.toLowerCase();
    const matchesSem = semFilter === "All" || s.semester?.toLowerCase() === semFilter.toLowerCase();
    const searchLow = q.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(searchLow) ||
      s.rollNo.toLowerCase().includes(searchLow) ||
      (s.email && s.email.toLowerCase().includes(searchLow));
    return matchesDept && matchesSem && matchesQuery;
  });

  const currentLimit = perPage === "All" ? filtered.length : perPage;
  const paged = filtered.slice((page - 1) * currentLimit, page * currentLimit);
  const totalPages = perPage === "All" ? 1 : Math.max(1, Math.ceil(filtered.length / perPage));

  // Selection helpers
  const isAllCurrentSelected = paged.length > 0 && paged.every((s) => selectedIds.has(s.id));
  const isAllFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      // By default select all currently visible or all filtered
      const allFiltered = new Set(filtered.map((s) => s.id));
      setSelectedIds(allFiltered);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Open Edit Dialog
  const handleOpenEdit = (s: StudentItem) => {
    setEditStudent(s);
    setEditName(s.name);
    setEditRollNo(s.rollNo);
    setEditSemester(s.semester || "6th");
    setEditSection(s.section || "");
    setEditDepartment(s.department || "B.Sc. Computer Science");
  };

  // Save Edit to Firestore
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setIsSavingEdit(true);
    try {
      await updateDoc(doc(db, "users", editStudent.id), {
        name: editName.trim(),
        rollNo: editRollNo.trim().toUpperCase(),
        semester: editSemester,
        section: editSection.trim(),
        department: editDepartment.trim(),
      });

      setStudents((prev) =>
        prev
          .map((s) =>
            s.id === editStudent.id
              ? {
                  ...s,
                  name: editName.trim(),
                  rollNo: editRollNo.trim().toUpperCase(),
                  semester: editSemester,
                  section: editSection.trim(),
                  department: editDepartment.trim(),
                }
              : s
          )
          .sort((a, b) =>
            (a.rollNo || "").localeCompare(b.rollNo || "", undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
      );

      toast.success(`Updated ${editName} (Semester set to ${editSemester})!`);
      setEditStudent(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update student");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Student removed successfully");
    } catch (err: any) {
      toast.error("Failed to delete student");
    }
  };

  // Bulk Promote Selected Students to Target Semester
  const handleBulkPromote = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to promote all ${selectedIds.size} selected student(s) to ${bulkTargetSem} Semester?`
      )
    )
      return;

    setIsBulkPromoting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "users", id), { semester: bulkTargetSem });
      });
      await batch.commit();

      setStudents((prev) =>
        prev.map((s) => (selectedIds.has(s.id) ? { ...s, semester: bulkTargetSem } : s))
      );

      toast.success(`Promoted ${selectedIds.size} student(s) to ${bulkTargetSem} Semester!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to bulk promote students");
    } finally {
      setIsBulkPromoting(false);
    }
  };

  // 1-Click Promote Entire Class
  const eligibleForClassPromotion = students.filter(
    (s) =>
      s.department?.toLowerCase() === promoteDept.toLowerCase() &&
      s.semester?.toLowerCase() === promoteFromSem.toLowerCase()
  );

  const handlePromoteClass = async () => {
    if (eligibleForClassPromotion.length === 0) {
      return toast.error(`No students found in ${promoteDept} with ${promoteFromSem} Semester.`);
    }

    setIsPromotingClass(true);
    try {
      const batch = writeBatch(db);
      eligibleForClassPromotion.forEach((s) => {
        batch.update(doc(db, "users", s.id), { semester: promoteToSem });
      });
      await batch.commit();

      const promotedIds = new Set(eligibleForClassPromotion.map((s) => s.id));
      setStudents((prev) =>
        prev.map((s) => (promotedIds.has(s.id) ? { ...s, semester: promoteToSem } : s))
      );

      toast.success(
        `Promoted all ${eligibleForClassPromotion.length} students from ${promoteFromSem} to ${promoteToSem} Semester!`
      );
      setIsPromoteClassOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to promote class");
    } finally {
      setIsPromotingClass(false);
    }
  };

  // Add new student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addRollNo.trim()) {
      return toast.error("Please enter student name and roll number");
    }

    setIsAdding(true);
    try {
      const newRef = doc(collection(db, "users"));
      const newDoc = {
        name: addName.trim(),
        rollNo: addRollNo.trim().toUpperCase(),
        email: addEmail.trim() || `${addRollNo.trim().toLowerCase()}@kongunaducollege.ac.in`,
        semester: addSemester,
        section: addSection.trim(),
        department: addDepartment.trim(),
        role: "student",
        createdAt: new Date().toISOString(),
      };

      await setDoc(newRef, newDoc);

      const addedItem: StudentItem = {
        id: newRef.id,
        name: newDoc.name,
        rollNo: newDoc.rollNo,
        email: newDoc.email,
        semester: newDoc.semester,
        section: newDoc.section,
        department: newDoc.department,
        attendance: 0,
        totalClasses: 0,
      };

      setStudents((prev) =>
        [...prev, addedItem].sort((a, b) =>
          (a.rollNo || "").localeCompare(b.rollNo || "", undefined, {
            numeric: true,
            sensitivity: "base",
          })
        )
      );

      toast.success(`Student ${newDoc.rollNo} added!`);
      setIsAddOpen(false);
      setAddName("");
      setAddRollNo("");
      setAddEmail("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add student");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      {/* Top Bar Filters & Search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search Reg No or Name..."
              className="h-10 w-64 rounded-xl pl-9"
            />
          </div>

          {/* Department Filter */}
          <Select
            value={dept}
            onValueChange={(val) => {
              setDept(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-44 rounded-xl text-xs">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {d === "All" ? "All Departments" : d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Semester Filter */}
          <Select
            value={semFilter}
            onValueChange={(val) => {
              setSemFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-36 rounded-xl text-xs">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s === "All" ? "All Semesters" : `${s} Sem`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={fetchStudents}
            title="Refresh"
            disabled={fetching}
          >
            <RotateCcw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setIsPromoteClassOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> Promote Entire Class
          </Button>
          <Button className="rounded-xl" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when any student is checked) */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/10 border border-primary/20 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <GraduationCap className="h-5 w-5" />
              <span>
                {selectedIds.size} of {filtered.length} student(s) selected
              </span>
            </div>

            {selectedIds.size < filtered.length ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-lg text-xs bg-background"
                onClick={selectAllFiltered}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                Select all {filtered.length} students
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                All {filtered.length} students selected
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Target Sem:</span>
            <Select value={bulkTargetSem} onValueChange={setBulkTargetSem}>
              <SelectTrigger className="h-8 w-28 rounded-lg text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s} Sem
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-8 rounded-lg shadow-xs"
              onClick={handleBulkPromote}
              disabled={isBulkPromoting}
            >
              {isBulkPromoting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
              )}
              Promote {selectedIds.size} to {bulkTargetSem} Sem
            </Button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllFilteredSelected || (paged.length > 0 && isAllCurrentSelected)}
                  onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
                />
              </TableHead>
              <TableHead className="w-[130px] font-semibold text-primary">Roll No. ↑</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-[90px]">Sem</TableHead>
              <TableHead className="w-[90px]">Section</TableHead>
              <TableHead className="w-[140px]">Attendance</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/30">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => handleToggleSelect(s.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold text-foreground">
                  {s.rollNo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {s.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-sm leading-tight">{s.name}</span>
                      {s.email && (
                        <div className="text-[11px] text-muted-foreground">{s.email}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.department}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-semibold text-xs">
                    {s.semester}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.section || "—"}</TableCell>
                <TableCell>
                  {s.totalClasses === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-medium text-muted-foreground">0%</span>
                      <Badge variant="outline" className="text-[10px] bg-muted/40 text-muted-foreground font-normal border-dashed">
                        New Sem (0 classes)
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            s.attendance >= 85
                              ? "bg-emerald-500"
                              : s.attendance >= 75
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          style={{ width: `${s.attendance}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.attendance}%</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-muted"
                      title="Edit Student / Change Semester"
                      onClick={() => handleOpenEdit(s)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                      title="Delete Student"
                      onClick={() => handleDeleteStudent(s.id, s.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {fetching && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                  <span className="text-xs">Loading students ordered by Reg No...</span>
                </TableCell>
              </TableRow>
            )}

            {!fetching && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No students found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Rows-Per-Page Controller */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm pt-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Showing {paged.length} of {filtered.length} students (ordered by Reg No)
          </span>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Show:</span>
            <Select
              value={String(perPage)}
              onValueChange={(val) => {
                setPerPage(val === "All" ? "All" : parseInt(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-20 rounded-lg text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="10" className="text-xs">
                  10
                </SelectItem>
                <SelectItem value="25" className="text-xs">
                  25
                </SelectItem>
                <SelectItem value="50" className="text-xs">
                  50
                </SelectItem>
                <SelectItem value="100" className="text-xs">
                  100
                </SelectItem>
                <SelectItem value="All" className="text-xs">
                  All ({filtered.length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs"
            disabled={page === 1 || perPage === "All"}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Badge variant="secondary" className="text-xs font-mono">
            Page {page} of {totalPages}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs"
            disabled={page >= totalPages || perPage === "All"}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* 1-Click Promote Entire Class Modal */}
      <Dialog open={isPromoteClassOpen} onOpenChange={setIsPromoteClassOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Promote Entire Class
            </DialogTitle>
            <DialogDescription>
              Batch update an entire department and semester to the new semester at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={promoteDept} onValueChange={setPromoteDept}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {DEPARTMENTS.filter((d) => d !== "All").map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Current Semester</Label>
                <Select value={promoteFromSem} onValueChange={setPromoteFromSem}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s} Sem
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>New Semester</Label>
                <Select value={promoteToSem} onValueChange={setPromoteToSem}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s} Sem
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl bg-muted/60 p-3 text-xs space-y-1">
              <div className="font-semibold text-foreground">
                Affected Students: {eligibleForClassPromotion.length}
              </div>
              <p className="text-muted-foreground">
                All {eligibleForClassPromotion.length} students currently in {promoteDept} (
                {promoteFromSem} Sem) will be updated to {promoteToSem} Sem in Cloud Firestore.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsPromoteClassOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={handlePromoteClass}
              disabled={isPromotingClass || eligibleForClassPromotion.length === 0}
            >
              {isPromotingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Promotion ({eligibleForClassPromotion.length} students)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={editStudent !== null} onOpenChange={(open) => !open && setEditStudent(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information or change their current semester.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Student Full Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-roll">Roll No / Reg No *</Label>
                <Input
                  id="edit-roll"
                  value={editRollNo}
                  onChange={(e) => setEditRollNo(e.target.value)}
                  className="rounded-xl font-mono uppercase text-sm"
                  required
                />
              </div>

              {/* SEMESTER FIELD - Directly changes student to 6th sem or other sem */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-sem">Semester *</Label>
                <Select value={editSemester} onValueChange={setEditSemester}>
                  <SelectTrigger id="edit-sem" className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dept">Department</Label>
                <Input
                  id="edit-dept"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-sec">Section</Label>
                <Input
                  id="edit-sec"
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  placeholder="e.g. A"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setEditStudent(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isSavingEdit}>
                {isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Student Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Register a student manually to the database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStudent} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Student Full Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g. DARWIN.E"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-roll">Roll / Reg No *</Label>
                <Input
                  id="add-roll"
                  placeholder="e.g. 241SC034"
                  value={addRollNo}
                  onChange={(e) => setAddRollNo(e.target.value)}
                  className="rounded-xl font-mono uppercase text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-sem">Semester *</Label>
                <Select value={addSemester} onValueChange={setAddSemester}>
                  <SelectTrigger id="add-sem" className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-email">Email (Optional)</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="241sc034@kongunaducollege.ac.in"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-dept">Department</Label>
                <Input
                  id="add-dept"
                  value={addDepartment}
                  onChange={(e) => setAddDepartment(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-sec">Section</Label>
                <Input
                  id="add-sec"
                  value={addSection}
                  onChange={(e) => setAddSection(e.target.value)}
                  placeholder="A"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isAdding}>
                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
