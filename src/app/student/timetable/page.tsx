"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weeklyTimetable } from "@/lib/mock-data";
import { Clock, User, BookOpen } from "lucide-react";

// Subject → colour mapping for visual distinction
const SUBJECT_COLORS: Record<string, string> = {
  "Operating Systems":                   "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  "Software Engineering & Testing":      "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
  "Cloud Computing (Major Elective)":    "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  "Database Management System":          "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  "DBMS Lab":                            "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800",
  "Extra Departmental Course (EDC)":     "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
};

const SUBJECT_SHORT: Record<string, string> = {
  "Operating Systems":                   "OS",
  "Software Engineering & Testing":      "SE",
  "Cloud Computing (Major Elective)":    "CC",
  "Database Management System":          "DBMS",
  "DBMS Lab":                            "Lab",
  "Extra Departmental Course (EDC)":     "EDC",
};

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Weekly Timetable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          III B.Sc. Computer Science — 5th Semester schedule
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SUBJECT_SHORT).map(([full, short]) => (
          <span
            key={short}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${SUBJECT_COLORS[full] ?? ""}`}
          >
            <span className="font-bold">{short}</span>
            <span className="text-muted-foreground hidden sm:inline">— {full}</span>
          </span>
        ))}
      </div>

      {/* Grid: 6 day columns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {weeklyTimetable.map((day) => (
          <Card key={day.day} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">{day.day}</h3>
              <Badge variant="secondary" className="text-xs">{day.slots.length} periods</Badge>
            </div>
            <div className="space-y-2">
              {day.slots.map((s, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-3 ${SUBJECT_COLORS[s.subject] ?? "bg-muted/30"}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-sm font-semibold leading-tight">
                      {SUBJECT_SHORT[s.subject] ?? s.subject}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">P{idx + 1}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground leading-snug line-clamp-1" title={s.subject}>
                    {s.subject}
                  </div>
                  {s.code && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground font-mono">
                      <BookOpen className="h-2.5 w-2.5 shrink-0" />
                      {s.code}
                    </div>
                  )}
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      {s.time}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate" title={s.faculty}>{s.faculty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
