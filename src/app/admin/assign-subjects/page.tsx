"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, BookOpen, Users, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

// ─── Subject catalogue (matches mock-data SUBJECTS) ──────────────────────────
const ALL_SUBJECTS = [
  { code: "24USC506", name: "Operating Systems",                  short: "OS" },
  { code: "24USC505", name: "Software Engineering & Testing",     short: "SE" },
  { code: "24USC5E1", name: "Cloud Computing (Major Elective)",   short: "CC" },
  { code: "24USC507", name: "Database Management System",         short: "DBMS" },
  { code: "24USC5CP", name: "DBMS Lab",                          short: "Lab" },
  { code: "EDC",      name: "Extra Departmental Course (EDC)",    short: "EDC" },
];

interface FacultyDoc {
  uid: string;
  name?: string;
  email?: string;
  department?: string;
  designation?: string;
  isTutor?: boolean;
  subjects?: string[];
}

export default function AssignSubjectsPage() {
  const [faculty, setFaculty] = useState<FacultyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  // local edits: uid → { subjects, isTutor }
  const [edits, setEdits] = useState<Record<string, { subjects: string[]; isTutor: boolean }>>({});

  useEffect(() => {
    fetch("/api/admin/assign-subjects")
      .then((r) => r.json())
      .then((data) => {
        setFaculty(data.faculty ?? []);
        // seed local edits from current values
        const init: typeof edits = {};
        for (const f of data.faculty ?? []) {
          init[f.uid] = { subjects: f.subjects ?? [], isTutor: f.isTutor ?? false };
        }
        setEdits(init);
      })
      .catch(() => toast.error("Failed to load faculty list"))
      .finally(() => setLoading(false));
  }, []);

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
      const res = await fetch("/api/admin/assign-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyUid: uid, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Subjects saved successfully");
      // update local faculty list
      setFaculty((prev) => prev.map((f) => f.uid === uid ? { ...f, ...payload } : f));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Assign Subjects to Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select which subjects each faculty member can mark attendance for.
          Class tutors can access all students.
        </p>
      </div>

      {faculty.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No faculty accounts found. Create them first via Bulk Create.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {faculty.map((f) => {
          const edit = edits[f.uid] ?? { subjects: [], isTutor: false };
          const isSaving = saving === f.uid;
          const isDirty =
            JSON.stringify([...(edit.subjects ?? [])].sort()) !==
              JSON.stringify([...(f.subjects ?? [])].sort()) ||
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
                  {f.designation && (
                    <Badge variant="secondary" className="mt-1 text-xs">{f.designation}</Badge>
                  )}
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

              {/* Subject checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <BookOpen className="h-3.5 w-3.5" />
                  Subjects
                </div>
                <div className="space-y-2">
                  {ALL_SUBJECTS.map((s) => (
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
    </div>
  );
}
