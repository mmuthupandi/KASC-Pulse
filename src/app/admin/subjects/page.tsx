"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Search, Plus, MoreHorizontal, Pencil, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { toast } from "sonner";

export interface SubjectItem {
  id?: string;
  code: string;
  name: string;
  short: string;
  type: "Core" | "Elective" | "Practical" | "EDC" | "Allied" | "Skill Based";
  sem: string;
  department: string;
}

const DEFAULT_SUBJECTS: Omit<SubjectItem, "id">[] = [
  { code: "24USC506", name: "Operating Systems", short: "OS", type: "Core", sem: "5th", department: "B.Sc. Computer Science" },
  { code: "24USC505", name: "Software Engineering & Testing", short: "SE", type: "Core", sem: "5th", department: "B.Sc. Computer Science" },
  { code: "24USC5E1", name: "Cloud Computing", short: "CC", type: "Elective", sem: "5th", department: "B.Sc. Computer Science" },
  { code: "24USC507", name: "Database Management System", short: "DBMS", type: "Core", sem: "5th", department: "B.Sc. Computer Science" },
  { code: "24USC5CP", name: "DBMS Lab", short: "Lab", type: "Practical", sem: "5th", department: "B.Sc. Computer Science" },
  { code: "EDC", name: "Extra Departmental Course", short: "EDC", type: "EDC", sem: "5th", department: "B.Sc. Computer Science" },
];

const SEMESTERS = ["All", "1st", "2nd", "3rd", "4th", "5th", "6th"];
const SUBJECT_TYPES: SubjectItem["type"][] = ["Core", "Elective", "Practical", "EDC", "Allied", "Skill Based"];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSem, setSelectedSem] = useState("6th");

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [type, setType] = useState<SubjectItem["type"]>("Core");
  const [sem, setSem] = useState("6th");
  const [department, setDepartment] = useState("B.Sc. Computer Science");

  // Load subjects from Firestore
  const loadSubjects = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "subjects"));
      if (snap.empty) {
        // Automatically seed default subjects so table isn't blank
        const batch = writeBatch(db);
        const seeded: SubjectItem[] = [];
        DEFAULT_SUBJECTS.forEach((sub) => {
          const docRef = doc(collection(db, "subjects"));
          batch.set(docRef, sub);
          seeded.push({ ...sub, id: docRef.id });
        });
        await batch.commit();
        setSubjects(seeded);
      } else {
        const loaded = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as SubjectItem[];
        setSubjects(loaded);
      }
    } catch (err: any) {
      console.error("Error loading subjects:", err);
      toast.error("Failed to load subjects. Using local defaults.");
      setSubjects(DEFAULT_SUBJECTS.map((s, i) => ({ ...s, id: `def-${i}` })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setCode("");
    setName("");
    setShort("");
    setType("Core");
    setSem(selectedSem === "All" ? "6th" : selectedSem);
    setDepartment("B.Sc. Computer Science");
    setIsModalOpen(true);
  };

  const openEditModal = (sub: SubjectItem) => {
    setIsEditing(true);
    setCurrentId(sub.id || null);
    setCode(sub.code);
    setName(sub.name);
    setShort(sub.short);
    setType(sub.type);
    setSem(sub.sem);
    setDepartment(sub.department || "B.Sc. Computer Science");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !short.trim()) {
      return toast.error("Please fill in all required fields (Code, Name, Short)");
    }

    setSaving(true);
    try {
      const payload: Omit<SubjectItem, "id"> = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        short: short.trim().toUpperCase(),
        type,
        sem,
        department: department.trim(),
      };

      if (isEditing && currentId) {
        await setDoc(doc(db, "subjects", currentId), payload, { merge: true });
        setSubjects((prev) =>
          prev.map((s) => (s.id === currentId ? { ...payload, id: currentId } : s))
        );
        toast.success("Subject updated successfully!");
      } else {
        const newRef = doc(collection(db, "subjects"));
        await setDoc(newRef, payload);
        setSubjects((prev) => [...prev, { ...payload, id: newRef.id }]);
        toast.success("New subject created successfully!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, subName: string) => {
    if (!confirm(`Are you sure you want to delete "${subName}"?`)) return;
    try {
      await deleteDoc(doc(db, "subjects", id));
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success("Subject removed");
    } catch (err: any) {
      toast.error("Failed to delete subject");
    }
  };

  // Filtered list
  const filtered = subjects.filter((s) => {
    const matchesSem = selectedSem === "All" || s.sem?.toLowerCase() === selectedSem.toLowerCase();
    const matchesSearch =
      s.code?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.short?.toLowerCase().includes(search.toLowerCase());
    return matchesSem && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Subjects & Curriculum</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage subject codes, courses, and syllabus mappings across all semesters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={loadSubjects} disabled={loading}>
            <RotateCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button className="rounded-xl shadow-sm" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Semester:</span>
            {SEMESTERS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={selectedSem === s ? "default" : "outline"}
                className="h-8 rounded-lg text-xs"
                onClick={() => setSelectedSem(s)}
              >
                {s === "All" ? "All Semesters" : `${s} Sem`}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search code, name..."
              className="h-9 rounded-xl pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Subjects Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm">Loading curriculum subjects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h3 className="font-medium text-base">No subjects found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {search || selectedSem !== "All"
                ? "Try clearing your search or semester filter."
                : "No subjects added yet. Click 'Add Subject' to get started."}
            </p>
            <Button size="sm" className="mt-4 rounded-xl" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead className="w-[100px]">Short</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[100px]">Semester</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id || s.code} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-semibold">{s.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm leading-tight">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground md:hidden mt-0.5">{s.department}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {s.short}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.type === "Core"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                          : s.type === "Elective"
                            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                            : s.type === "Practical"
                              ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                              : "bg-muted"
                      }
                    >
                      {s.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-xs">{s.sem}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {s.department}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuLabel className="text-xs">Manage</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditModal(s)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => s.id && handleDelete(s.id, s.name)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add / Edit Subject Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update subject details, code, or department mapping."
                : "Enter subject details to add to the semester curriculum."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-code">Subject Code *</Label>
                <Input
                  id="sub-code"
                  placeholder="e.g. 24USC601"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="rounded-xl uppercase font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sub-short">Short Name *</Label>
                <Input
                  id="sub-short"
                  placeholder="e.g. ML"
                  value={short}
                  onChange={(e) => setShort(e.target.value)}
                  className="rounded-xl uppercase text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-name">Subject Name *</Label>
              <Input
                id="sub-name"
                placeholder="e.g. Machine Learning & AI"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Course Type</Label>
                <Select value={type} onValueChange={(val) => setType(val as SubjectItem["type"])}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SUBJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={sem} onValueChange={setSem}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select semester" />
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
              <Label htmlFor="sub-dept">Department</Label>
              <Input
                id="sub-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="rounded-xl text-sm"
                placeholder="e.g. B.Sc. Computer Science"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
