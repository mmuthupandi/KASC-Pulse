"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, BookOpen, Users, ShieldCheck, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

interface SubjectItem {
  code: string;
  name: string;
  short: string;
  sem?: string;
  department?: string;
}

interface FacultyDoc {
  uid: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  designation?: string;
  isTutor?: boolean;
  subjects?: string[];
  allowedSubjects?: string[];
}

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const DEPARTMENTS = ["B.Sc. Computer Science", "BCA", "B.Sc. IT", "B.Com", "B.Sc. Mathematics"];

export default function AssignSubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [faculty, setFaculty] = useState<FacultyDoc[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [selectedSem, setSelectedSem] = useState("6th");
  const [selectedDept, setSelectedDept] = useState("B.Sc. Computer Science");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { subjects: string[]; isTutor: boolean }>>({});

  useEffect(() => {
    async function loadData() {
      try {
        // Load subjects from Firestore
        const subSnap = await getDocs(collection(db, "subjects"));
        const rawSubs: SubjectItem[] = [];
        const seen = new Set<string>();

        subSnap.docs.forEach((d) => {
          const data = d.data();
          const code = (data.code || "").toUpperCase().trim();
          if (!code) return;
          // Deduplicate by code and sem
          const key = `${code}_${data.sem || "5th"}`;
          if (!seen.has(key)) {
            seen.add(key);
            rawSubs.push({
              code,
              name: data.name || code,
              short: data.short || code,
              sem: data.sem || "5th",
              department: data.department || "B.Sc. Computer Science",
            });
          }
        });

        setAllSubjects(rawSubs);

        // Load faculty and HODs
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "in", ["faculty", "hod"]))
        );
        const facs = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as FacultyDoc));

        // Sort: HODs first, then alphabetical by name
        facs.sort((a, b) => {
          if (a.role === "hod" && b.role !== "hod") return -1;
          if (b.role === "hod" && a.role !== "hod") return 1;
          return (a.name || "").localeCompare(b.name || "");
        });

        setFaculty(facs);

        const init: typeof edits = {};
        for (const f of facs) {
          init[f.uid] = { subjects: f.subjects || f.allowedSubjects || [], isTutor: f.isTutor ?? false };
        }
        setEdits(init);
      } catch (err) {
        toast.error("Failed to load faculty and subjects");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter subjects strictly to the active semester
  const semesterSubjects = allSubjects.filter((s) => {
    const matchesSem = (s.sem || "").toLowerCase() === selectedSem.toLowerCase();
    return matchesSem;
  });

  function toggleSubject(uid: string, code: string) {
    setEdits((prev) => {
      const cur = prev[uid] ?? { subjects: [], isTutor: false };
      const has = cur.subjects.includes(code);
      return {
        ...prev,
        [uid]: { ...cur, subjects: has ? cur.subjects.filter((s) => s !== code) : [...cur.subjects, code] },
      };
    });
  }

  function toggleTutor(uid: string, val: boolean) {
    setEdits((prev) => ({ ...prev, [uid]: { ...(prev[uid] ?? { subjects: [] }), isTutor: val } }));
  }

  async function save(uid: string) {
    setSaving(uid);
    try {
      const payload = edits[uid] ?? { subjects: [], isTutor: false };
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        subjects: payload.subjects,
        allowedSubjects: payload.subjects,
        isTutor: payload.isTutor,
      });

      setFaculty((prev) =>
        prev.map((f) =>
          f.uid === uid ? { ...f, subjects: payload.subjects, allowedSubjects: payload.subjects, isTutor: payload.isTutor } : f
        )
      );

      toast.success("Saved subject assignments");
    } catch (err) {
      toast.error("Failed to save. Try again.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Assign Subjects to Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select which subjects each faculty member can mark attendance for in the current semester.
          </p>
        </div>
      </div>

      {/* Semester & Department Selector Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semester:</Label>
              <Select value={selectedSem} onValueChange={setSelectedSem}>
                <SelectTrigger className="h-9 w-32 rounded-xl text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s} Semester
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dept:</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-9 w-48 rounded-xl text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-primary">{semesterSubjects.length} subjects</span> for {selectedSem} Semester
          </div>
        </div>
      </Card>

      {/* Faculty Cards Grid */}
      {faculty.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No faculty accounts found. Create them first via Bulk Create.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {faculty.map((f) => {
            const edit = edits[f.uid] ?? { subjects: [], isTutor: false };
            const isSaving = saving === f.uid;
            const isDirty =
              JSON.stringify([...(edit.subjects ?? [])].sort()) !==
                JSON.stringify([...(f.subjects || f.allowedSubjects || [])].sort()) ||
              edit.isTutor !== (f.isTutor ?? false);

            return (
              <Card key={f.uid} className="p-5 space-y-4">
                {/* Faculty header */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {f.name?.slice(0, 2).toUpperCase() ?? "FA"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{f.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.email}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {f.role === "hod" && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 text-[10px] font-semibold">
                          HOD
                        </Badge>
                      )}
                      {f.designation && (
                        <Badge variant="secondary" className="text-xs">{f.designation}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Class Tutor toggle */}
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Class Tutor</span>
                  </div>
                  <Switch
                    checked={edit.isTutor}
                    onCheckedChange={(v) => toggleTutor(f.uid, v)}
                  />
                </div>

                {/* Subjects for selected semester ONLY */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span>{selectedSem} Sem Subjects</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground lowercase">
                      {edit.subjects.filter((c) => semesterSubjects.some((s) => s.code === c)).length} assigned
                    </span>
                  </div>

                  {semesterSubjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No subjects found for {selectedSem} Semester. Add them in <span className="font-medium text-primary">Subjects</span>.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {semesterSubjects.map((s) => (
                        <label
                          key={s.code}
                          className="flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <Checkbox
                            checked={edit.subjects.includes(s.code)}
                            onCheckedChange={() => toggleSubject(f.uid, s.code)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{s.short}</div>
                            <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{s.code}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  className="w-full rounded-xl"
                  disabled={!isDirty || isSaving}
                  onClick={() => save(f.uid)}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isDirty ? "Save changes" : "Saved"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
