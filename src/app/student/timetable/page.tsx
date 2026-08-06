"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weeklyTimetable } from "@/lib/mock-data";
import { Clock, MapPin, User } from "lucide-react";

export default function Page() { return <TimetablePage />; }

function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Weekly Timetable</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your class schedule for this week.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {weeklyTimetable.map((day) => (
          <Card key={day.day} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{day.day}</h3>
              <Badge variant="secondary">{day.slots.length} classes</Badge>
            </div>
            <div className="space-y-2">
              {day.slots.map((s) => (
                <div key={s.time} className="rounded-xl border p-3">
                  <div className="text-sm font-medium">{s.subject}</div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{s.time}</div>
                    <div className="flex items-center gap-1.5"><User className="h-3 w-3" />{s.faculty}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{s.room}</div>
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