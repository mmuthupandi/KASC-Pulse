"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  User,
  BookOpen,
  Save,
  RotateCcw,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { weeklyTimetable as defaultMockSchedule } from "@/lib/mock-data";

export interface TimetableSlot {
  period: number;
  time: string;
  subject: string;
  code: string;
  faculty: string;
}

export interface DaySchedule {
  day: string;
  slots: TimetableSlot[];
}

const DEFAULT_DAYS = [
  "Day 1 (Mon)",
  "Day 2 (Tue)",
  "Day 3 (Wed)",
  "Day 4 (Thu)",
  "Day 5 (Fri)",
  "Day 6 (Sat)",
];

const DEFAULT_TIMES = [
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const DEPARTMENTS = ["B.Sc. Computer Science", "BCA", "B.Sc. IT", "B.Com", "B.Sc. Mathematics"];

export default function AdminTimetablePage() {
  const [department, setDepartment] = useState("B.Sc. Computer Science");
  const [semester, setSemester] = useState("6th");

  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Available options from Firestore
  const [availableSubjects, setAvailableSubjects] = useState<Array<{ code: string; name: string; short: string; sem?: string }>>([]);
  const [availableFaculty, setAvailableFaculty] = useState<Array<{ uid: string; name: string; designation?: string }>>([]);

  // Slot editor dialog state
  const [editingSlot, setEditingSlot] = useState<{
    dayIndex: number;
    periodIndex: number;
    dayName: string;
  } | null>(null);

  const [slotSubject, setSlotSubject] = useState("");
  const [slotCode, setSlotCode] = useState("");
  const [slotFaculty, setSlotFaculty] = useState("");
  const [slotTime, setSlotTime] = useState("");

  // Helpers to normalize document id
  const getDocId = (dept: string, sem: string) => {
    const cleanDept = dept.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const cleanSem = sem.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    return `${cleanDept}_${cleanSem}`;
  };

  // Build an empty 6-day, 5-period structure
  const buildBlankSchedule = (): DaySchedule[] => {
    return DEFAULT_DAYS.map((day) => ({
      day,
      slots: DEFAULT_TIMES.map((time, idx) => ({
        period: idx + 1,
        time,
        subject: "",
        code: "",
        faculty: "",
      })),
    }));
  };

  // Fetch subjects & faculty from Firestore
  useEffect(() => {
    async function loadMeta() {
      try {
        // Load subjects
        const subSnap = await getDocs(collection(db, "subjects"));
        const subs: Array<{ code: string; name: string; short: string; sem?: string }> = [];
        const seen = new Set<string>();

        subSnap.docs.forEach((d) => {
          const data = d.data();
          const code = (data.code || "").toUpperCase().trim();
          if (!code) return;
          const key = `${code}_${data.sem || "6th"}`;
          if (!seen.has(key)) {
            seen.add(key);
            subs.push({
              code,
              name: data.name || code,
              short: data.short || code,
              sem: (data.sem || "6th").toLowerCase(),
            });
          }
        });
        setAvailableSubjects(subs);

        // Load faculty and HODs
        const facSnap = await getDocs(
          query(collection(db, "users"), where("role", "in", ["faculty", "hod", "admin"]))
        );
        const facs = facSnap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            name: data.name || data.email || "Faculty",
            designation: data.designation || data.role,
          };
        });
        setAvailableFaculty(facs);
      } catch (err) {
        console.error("Error loading meta for timetable:", err);
      }
    }
    loadMeta();
  }, []);

  // Load timetable for selected department & semester
  useEffect(() => {
    async function fetchTimetable() {
      setLoading(true);
      const docId = getDocId(department, semester);
      try {
        const snap = await getDoc(doc(db, "timetables", docId));
        if (snap.exists() && snap.data().days) {
          setSchedule(snap.data().days as DaySchedule[]);
        } else {
          // If 5th sem Computer Science and not in Firestore yet, load default mock schedule
          if (semester === "5th" && department === "B.Sc. Computer Science") {
            const mapped: DaySchedule[] = defaultMockSchedule.map((d) => ({
              day: d.day,
              slots: d.slots.map((s, idx) => ({
                period: idx + 1,
                time: s.time,
                subject: s.subject,
                code: s.code || "",
                faculty: s.faculty || "",
              })),
            }));
            setSchedule(mapped);
          } else {
            setSchedule(buildBlankSchedule());
          }
        }
      } catch (err: any) {
        console.error("Error fetching timetable:", err);
        toast.error("Failed to load timetable from database.");
        setSchedule(buildBlankSchedule());
      } finally {
        setLoading(false);
      }
    }

    fetchTimetable();
  }, [department, semester]);

  // Open editor for a specific slot
  const handleOpenEditSlot = (dayIndex: number, periodIndex: number) => {
    const day = schedule[dayIndex];
    if (!day) return;
    const current = day.slots[periodIndex] || {
      period: periodIndex + 1,
      time: DEFAULT_TIMES[periodIndex] || "10:00 - 11:00",
      subject: "",
      code: "",
      faculty: "",
    };

    setEditingSlot({
      dayIndex,
      periodIndex,
      dayName: day.day,
    });

    setSlotSubject(current.subject || "");
    setSlotCode(current.code || "");
    setSlotFaculty(current.faculty || "");
    setSlotTime(current.time || DEFAULT_TIMES[periodIndex]);
  };

  // When subject dropdown changes, also auto-fill code
  const handleSubjectSelect = (subName: string) => {
    setSlotSubject(subName);
    const found = availableSubjects.find((s) => s.name === subName);
    if (found) {
      setSlotCode(found.code);
    }
  };

  // Save the slot back into state
  const handleSaveSlot = () => {
    if (!editingSlot) return;
    const { dayIndex, periodIndex } = editingSlot;

    setSchedule((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex] };
      const targetSlots = [...targetDay.slots];

      targetSlots[periodIndex] = {
        period: periodIndex + 1,
        time: slotTime,
        subject: slotSubject.trim(),
        code: slotCode.trim().toUpperCase(),
        faculty: slotFaculty.trim(),
      };

      targetDay.slots = targetSlots;
      copy[dayIndex] = targetDay;
      return copy;
    });

    setEditingSlot(null);
    toast.success("Period updated! Remember to click 'Save Timetable' to apply changes.");
  };

  // Clear slot contents
  const handleClearSlot = () => {
    if (!editingSlot) return;
    const { dayIndex, periodIndex } = editingSlot;

    setSchedule((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex] };
      const targetSlots = [...targetDay.slots];

      targetSlots[periodIndex] = {
        period: periodIndex + 1,
        time: DEFAULT_TIMES[periodIndex],
        subject: "",
        code: "",
        faculty: "",
      };

      targetDay.slots = targetSlots;
      copy[dayIndex] = targetDay;
      return copy;
    });

    setEditingSlot(null);
    toast.info("Period cleared.");
  };

  // Save entire timetable to Firestore
  const handleSaveToFirestore = async () => {
    setSaving(true);
    const docId = getDocId(department, semester);
    try {
      await setDoc(doc(db, "timetables", docId), {
        department,
        semester,
        days: schedule,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Timetable saved for ${department} (${semester} Sem)!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save timetable to database.");
    } finally {
      setSaving(false);
    }
  };

  // Load default template
  const handleLoadDefaultTemplate = () => {
    if (!confirm("This will overwrite the current grid with the default 5th semester template. Proceed?")) return;
    const mapped: DaySchedule[] = defaultMockSchedule.map((d) => ({
      day: d.day,
      slots: d.slots.map((s, idx) => ({
        period: idx + 1,
        time: s.time,
        subject: s.subject,
        code: s.code || "",
        faculty: s.faculty || "",
      })),
    }));
    setSchedule(mapped);
    toast.info("Default template loaded. Click 'Save Timetable' to commit.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Timetable Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Design and customize class schedules, period timings, and assigned faculty for any semester.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handleLoadDefaultTemplate}>
            <Sparkles className="mr-2 h-4 w-4 text-amber-500" /> Load Template
          </Button>
          <Button className="rounded-xl shadow-sm" onClick={handleSaveToFirestore} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Timetable
          </Button>
        </div>
      </div>

      {/* Selectors Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dept:</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-[220px] h-9 rounded-xl text-xs font-medium">
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

            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester:</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs font-medium">
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
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {department}
            </Badge>
            <span>•</span>
            <span className="font-semibold">{semester} Semester</span>
          </div>
        </div>
      </Card>

      {/* Timetable Grid */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center p-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading timetable...</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {schedule.map((day, dIdx) => (
            <Card key={day.day} className="p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-sm text-foreground">{day.day}</h3>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {day.slots.filter((s) => s.subject).length}/5 Scheduled
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {day.slots.map((s, pIdx) => {
                    const isConfigured = Boolean(s.subject);
                    return (
                      <div
                        key={pIdx}
                        onClick={() => handleOpenEditSlot(dIdx, pIdx)}
                        className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer ${
                          isConfigured
                            ? "bg-card hover:border-primary/50 hover:bg-muted/40 shadow-xs"
                            : "border-dashed border-muted-foreground/30 bg-muted/10 hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[11px] font-semibold text-primary">
                            Period {pIdx + 1}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{s.time}</span>
                        </div>

                        {isConfigured ? (
                          <div className="mt-1 space-y-1">
                            <div className="font-medium text-xs text-foreground line-clamp-1" title={s.subject}>
                              {s.subject}
                            </div>
                            {s.code && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                <BookOpen className="h-2.5 w-2.5 shrink-0" />
                                {s.code}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 truncate">
                              <User className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{s.faculty || "Unassigned"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 flex items-center justify-center gap-1 text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
                            <Plus className="h-3 w-3" />
                            <span>Add Period</span>
                          </div>
                        )}

                        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t text-[11px] text-muted-foreground text-center">
                Click any period slot to edit
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Slot Dialog */}
      <Dialog open={editingSlot !== null} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Edit Period {editingSlot ? editingSlot.periodIndex + 1 : ""}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingSlot?.dayName} • Configure subject, period timing, and faculty.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 w-full min-w-0">
            {/* Period Timing */}
            <div className="space-y-1.5 w-full min-w-0">
              <Label htmlFor="period-time" className="text-xs font-medium">Period Timing</Label>
              <Input
                id="period-time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                placeholder="e.g. 10:00 - 11:00"
                className="h-10 w-full min-w-0 rounded-xl text-sm"
              />
            </div>

            {/* Subject Dropdown & Name */}
            <div className="space-y-1.5 w-full min-w-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="period-subject" className="text-xs font-medium">Subject</Label>
                <span className="text-[10px] text-muted-foreground">Pick from list or type custom</span>
              </div>
              <Select value={slotSubject} onValueChange={handleSubjectSelect}>
                <SelectTrigger className="h-10 w-full min-w-0 max-w-full rounded-xl text-sm overflow-hidden [&>span]:truncate [&>span]:block">
                  <SelectValue placeholder="Select from curriculum..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56 max-w-[calc(100vw-3rem)] sm:max-w-[400px]">
                  {availableSubjects
                    .filter((s) => (s.sem || "").toLowerCase() === semester.toLowerCase())
                    .map((s) => (
                      <SelectItem key={s.code} value={s.name} className="text-xs">
                        <span className="font-mono mr-1.5 text-muted-foreground">[{s.code}]</span>
                        <span className="truncate">{s.name}</span>
                      </SelectItem>
                    ))}
                  <SelectItem value="Extra Departmental Course (EDC)" className="text-xs">
                    Extra Departmental Course (EDC)
                  </SelectItem>
                  <SelectItem value="Library / Self Study" className="text-xs">
                    Library / Self Study
                  </SelectItem>
                  <SelectItem value="Physical Education / Sports" className="text-xs">
                    Physical Education / Sports
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Subject display name..."
                value={slotSubject}
                onChange={(e) => setSlotSubject(e.target.value)}
                className="h-9 w-full min-w-0 rounded-xl text-xs mt-1"
              />
            </div>

            {/* Subject Code */}
            <div className="space-y-1.5 w-full min-w-0">
              <Label htmlFor="period-code" className="text-xs font-medium">Subject Code</Label>
              <Input
                id="period-code"
                placeholder="e.g. 24USC601"
                value={slotCode}
                onChange={(e) => setSlotCode(e.target.value)}
                className="h-9 w-full min-w-0 rounded-xl uppercase font-mono text-xs"
              />
            </div>

            {/* Faculty Dropdown & Custom Name */}
            <div className="space-y-1.5 w-full min-w-0">
              <Label htmlFor="period-faculty" className="text-xs font-medium">Assigned Faculty</Label>
              <Select value={slotFaculty} onValueChange={setSlotFaculty}>
                <SelectTrigger className="h-10 w-full min-w-0 max-w-full rounded-xl text-sm overflow-hidden [&>span]:truncate [&>span]:block">
                  <SelectValue placeholder="Select faculty member..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56 max-w-[calc(100vw-3rem)] sm:max-w-[400px]">
                  {availableFaculty.map((f) => (
                    <SelectItem key={f.uid} value={f.name} className="text-xs">
                      <span className="truncate">{f.name}</span> {f.designation ? `(${f.designation})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or custom faculty name..."
                value={slotFaculty}
                onChange={(e) => setSlotFaculty(e.target.value)}
                className="h-9 w-full min-w-0 rounded-xl text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-destructive hover:bg-destructive/10 text-xs h-9"
              onClick={handleClearSlot}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear Slot
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs h-9"
                onClick={() => setEditingSlot(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl text-xs h-9"
                onClick={handleSaveSlot}
              >
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
