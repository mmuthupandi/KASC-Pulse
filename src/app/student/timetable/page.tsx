"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { weeklyTimetable as defaultMockSchedule } from "@/lib/mock-data";
import { Clock, User, BookOpen, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

interface SlotItem {
  period?: number;
  time: string;
  subject: string;
  code?: string;
  faculty?: string;
}

interface DayItem {
  day: string;
  slots: SlotItem[];
}

const SUBJECT_COLORS: Record<string, string> = {
  // 6th Semester
  "CORE PAPER 8 – COMPUTER NETWORKS":                            "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  "CORE PAPER 9 – PYTHON PROGRAMMING AND IoT":                   "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  "CORE PAPER 10 – ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
  "CORE PRACTICAL 6 – PYTHON PROGRAMMING AND IoT LAB":           "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800",
  "MAJOR ELECTIVE PAPER 2 - INTRODUCTION TO DATA SCIENCE":       "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  "SKILL BASED SUBJECT 3 - BASICS OF INTELLECTUAL PROPERTY RIGHTS": "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  "PROJECT AND VIVA VOCE":                                       "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
  // 5th Semester
  "Operating Systems":                   "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  "Software Engineering & Testing":      "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
  "Cloud Computing (Major Elective)":    "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  "Cloud Computing":                     "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  "Database Management System":          "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  "DBMS Lab":                            "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800",
  "Extra Departmental Course (EDC)":     "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
  "Extra Departmental Course":           "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
};

export default function TimetablePage() {
  const { user } = useAuth();
  const [selectedSem, setSelectedSem] = useState(user?.semester || "6th");
  const [timetable, setTimetable] = useState<DayItem[]>(defaultMockSchedule);
  const [loading, setLoading] = useState(true);

  const department = user?.department || "B.Sc. Computer Science";

  useEffect(() => {
    async function loadTimetable() {
      setLoading(true);
      const cleanDept = department.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const cleanSem = selectedSem.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const docId = `${cleanDept}_${cleanSem}`;

      try {
        const snap = await getDoc(doc(db, "timetables", docId));
        if (snap.exists() && snap.data().days) {
          setTimetable(snap.data().days as DayItem[]);
        } else {
          // If 5th sem, use mock schedule fallback
          if (selectedSem === "5th") {
            setTimetable(defaultMockSchedule);
          } else {
            setTimetable([]);
          }
        }
      } catch (err) {
        console.error("Failed to load timetable:", err);
        setTimetable(defaultMockSchedule);
      } finally {
        setLoading(false);
      }
    }

    loadTimetable();
  }, [department, selectedSem]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Weekly Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {department} — {selectedSem} Semester schedule
          </p>
        </div>

        {/* Semester quick switch */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["1st", "2nd", "3rd", "4th", "5th", "6th"].map((sem) => (
            <Button
              key={sem}
              size="sm"
              variant={selectedSem === sem ? "default" : "outline"}
              className="h-8 rounded-lg text-xs"
              onClick={() => setSelectedSem(sem)}
            >
              {sem} Sem
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center p-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading schedule...</p>
        </Card>
      ) : timetable.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-medium text-base text-foreground">No timetable scheduled yet</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto">
            The administrator has not configured a timetable for {selectedSem} semester yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {timetable.map((day) => (
            <Card key={day.day} className="p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-sm">{day.day}</h3>
                <Badge variant="secondary" className="text-xs">
                  {day.slots.filter((s) => s.subject).length} periods
                </Badge>
              </div>
              <div className="space-y-2">
                {day.slots.map((s, idx) => {
                  if (!s.subject) {
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-dashed p-3 bg-muted/10 text-center text-xs text-muted-foreground/60"
                      >
                        Period {idx + 1} — Free
                      </div>
                    );
                  }

                  const colorClass = SUBJECT_COLORS[s.subject] ?? "bg-card border-border";

                  return (
                    <div key={idx} className={`rounded-xl border p-3 ${colorClass}`}>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm font-semibold leading-tight line-clamp-1" title={s.subject}>
                          {s.subject}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          P{s.period || idx + 1}
                        </span>
                      </div>
                      {s.code && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-mono">
                          <BookOpen className="h-2.5 w-2.5 shrink-0" />
                          {s.code}
                        </div>
                      )}
                      <div className="mt-2 space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {s.time}
                        </div>
                        {s.faculty && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate" title={s.faculty}>
                              {s.faculty}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
