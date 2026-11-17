"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  ShieldCheck,
  RotateCcw,
  Mail,
  Lock,
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
} from "firebase/firestore";

interface FacultyItem {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  isTutor?: boolean;
  subjects?: string[];
}

const DEPARTMENTS = [
  "All",
  "B.Sc. Computer Science",
  "BCA",
  "B.Sc. IT",
  "B.Com",
  "B.Sc. Mathematics",
];

const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Head of Department",
  "Guest Lecturer",
];

export function FacultyTable() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [page, setPage] = useState(1);
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);
  const [fetching, setFetching] = useState(true);

  // Add Faculty Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("Password@123");
  const [addDepartment, setAddDepartment] = useState("B.Sc. Computer Science");
  const [addDesignation, setAddDesignation] = useState("Assistant Professor");
  const [addIsTutor, setAddIsTutor] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Edit Faculty Modal state
  const [editItem, setEditItem] = useState<FacultyItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("B.Sc. Computer Science");
  const [editDesignation, setEditDesignation] = useState("Assistant Professor");
  const [editIsTutor, setEditIsTutor] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchFaculty = async () => {
    setFetching(true);
    try {
      const qFaculty = query(
        collection(db, "users"),
        where("role", "in", ["faculty", "hod"])
      );
      const snap = await getDocs(qFaculty);
      const data: FacultyItem[] = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          name: raw.name || "Unknown",
          email: raw.email || "",
          department: raw.department || "B.Sc. Computer Science",
          designation: raw.designation || (raw.role === "hod" ? "Head of Department" : "Assistant Professor"),
          isTutor: raw.isTutor ?? false,
          subjects: raw.subjects || [],
        };
      });

      // Sort by name
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setFaculty(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch faculty list");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const perPage = 10;
  const filtered = faculty.filter((f) => {
    const matchesDept = dept === "All" || f.department?.toLowerCase() === dept.toLowerCase();
    const searchLow = q.toLowerCase();
    const matchesQuery =
      f.name?.toLowerCase().includes(searchLow) ||
      f.email?.toLowerCase().includes(searchLow) ||
      f.designation?.toLowerCase().includes(searchLow);
    return matchesDept && matchesQuery;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  // Open Edit Modal
  const handleOpenEdit = (f: FacultyItem) => {
    setEditItem(f);
    setEditName(f.name);
    setEditDepartment(f.department || "B.Sc. Computer Science");
    setEditDesignation(f.designation || "Assistant Professor");
    setEditIsTutor(f.isTutor ?? false);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setIsSavingEdit(true);
    try {
      await updateDoc(doc(db, "users", editItem.id), {
        name: editName.trim(),
        department: editDepartment.trim(),
        designation: editDesignation.trim(),
        isTutor: editIsTutor,
      });

      setFaculty((prev) =>
        prev.map((f) =>
          f.id === editItem.id
            ? {
                ...f,
                name: editName.trim(),
                department: editDepartment.trim(),
                designation: editDesignation.trim(),
                isTutor: editIsTutor,
              }
            : f
        )
      );

      toast.success(`Updated ${editName}'s profile`);
      setEditItem(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update faculty");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Faculty
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete faculty "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setFaculty((prev) => prev.filter((f) => f.id !== id));
      toast.success("Faculty member deleted");
    } catch (err) {
      toast.error("Failed to delete faculty member");
    }
  };

  // Add Faculty (calls backend admin API to create both Firebase Auth + Firestore user)
  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      return toast.error("Please fill in name, email, and password");
    }

    if (addPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: [
            {
              name: addName.trim(),
              email: addEmail.trim().toLowerCase(),
              password: addPassword,
              role: "faculty",
              department: addDepartment.trim(),
              designation: addDesignation.trim(),
              isTutor: addIsTutor,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create faculty member");
      }

      if (data.results && data.results[0]?.status === "error") {
        throw new Error(data.results[0].error || "Failed to create account");
      }

      toast.success(`Faculty ${addName} created successfully!`);
      setIsAddOpen(false);
      setAddName("");
      setAddEmail("");
      setAddPassword("Password@123");
      setAddIsTutor(false);

      // Refresh list
      fetchFaculty();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create faculty member");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search faculty name or email..."
              className="h-10 w-64 rounded-xl pl-9"
            />
          </div>

          <Select
            value={dept}
            onValueChange={(val) => {
              setDept(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-48 rounded-xl text-xs">
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

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={fetchFaculty}
            title="Refresh"
            disabled={fetching}
          >
            <RotateCcw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button className="rounded-xl shadow-xs" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Faculty
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px]">Faculty</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="w-[120px]">Tutor</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((f) => (
              <TableRow key={f.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {f.name?.slice(0, 2).toUpperCase() || "FA"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm leading-tight truncate">{f.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground truncate">{f.email || "—"}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{f.department || "—"}</TableCell>
                <TableCell>
                  {f.designation ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      {f.designation}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {f.isTutor ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Class Tutor
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-muted"
                      title="Edit Faculty"
                      onClick={() => handleOpenEdit(f)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                      title="Delete Faculty"
                      onClick={() => handleDelete(f.id, f.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {fetching && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                  <span className="text-xs">Loading faculty members...</span>
                </TableCell>
              </TableRow>
            )}

            {!fetching && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No faculty members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm pt-1">
        <span className="text-xs text-muted-foreground">
          Showing {paged.length} of {filtered.length} faculty members
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs"
            disabled={page === 1}
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
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Add Faculty Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Faculty Member</DialogTitle>
            <DialogDescription>
              Create a login account and register a staff member to the department.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFaculty} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g. Dr. K. Ramesh"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-email">Official College Email *</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="add-email"
                  type="email"
                  placeholder="ramesh_cs@kongunaducollege.ac.in"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="rounded-xl pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-password">Temporary Password *</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="add-password"
                  type="text"
                  placeholder="Min 8 characters"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="rounded-xl pl-9 text-sm font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">The staff member can use this to sign in.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={addDepartment} onValueChange={setAddDepartment}>
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

              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Select value={addDesignation} onValueChange={setAddDesignation}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DESIGNATIONS.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Class Tutor</div>
                <div className="text-xs text-muted-foreground">Grant permission to view class reports & condonation.</div>
              </div>
              <Switch checked={addIsTutor} onCheckedChange={setAddIsTutor} />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isAdding}>
                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Staff Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Modal */}
      <Dialog open={editItem !== null} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Faculty Profile</DialogTitle>
            <DialogDescription>Update faculty designation, department, or tutor role.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fac-name">Full Name *</Label>
              <Input
                id="edit-fac-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={editDepartment} onValueChange={setEditDepartment}>
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

              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Select value={editDesignation} onValueChange={setEditDesignation}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DESIGNATIONS.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Class Tutor</div>
                <div className="text-xs text-muted-foreground">Grant permission to view class reports & condonation.</div>
              </div>
              <Switch checked={editIsTutor} onCheckedChange={setEditIsTutor} />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditItem(null)}>
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
    </Card>
  );
}
