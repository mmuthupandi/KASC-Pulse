"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

interface CalendarDay {
  dateStr: string;
  isWorkingDay: boolean;
  cycle: string;
  dayOrder: string;
  count: string;
}

const INITIAL_DATA: CalendarDay[] = [
  { dateStr: "2026-09-18", isWorkingDay: true, cycle: "12", dayOrder: "III", count: "69" },
  { dateStr: "2026-09-19", isWorkingDay: true, cycle: "12", dayOrder: "IV", count: "70" },
  { dateStr: "2026-09-20", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-09-21", isWorkingDay: true, cycle: "12", dayOrder: "V", count: "71" },
  { dateStr: "2026-09-22", isWorkingDay: true, cycle: "12", dayOrder: "VI", count: "72" },
  { dateStr: "2026-09-23", isWorkingDay: true, cycle: "13", dayOrder: "I", count: "73" },
  { dateStr: "2026-09-24", isWorkingDay: true, cycle: "13", dayOrder: "II", count: "74" },
  { dateStr: "2026-09-25", isWorkingDay: true, cycle: "13", dayOrder: "III", count: "75" },
  { dateStr: "2026-09-26", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-09-27", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-09-28", isWorkingDay: true, cycle: "13", dayOrder: "IV", count: "76" },
  { dateStr: "2026-09-29", isWorkingDay: true, cycle: "13", dayOrder: "V", count: "77" },
  { dateStr: "2026-09-30", isWorkingDay: true, cycle: "13", dayOrder: "VI", count: "78" },
  { dateStr: "2026-10-01", isWorkingDay: true, cycle: "14", dayOrder: "I", count: "79" },
  { dateStr: "2026-10-02", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-10-03", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-10-04", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-10-05", isWorkingDay: true, cycle: "14", dayOrder: "II", count: "80" },
  { dateStr: "2026-10-06", isWorkingDay: true, cycle: "14", dayOrder: "III", count: "81" },
  { dateStr: "2026-10-07", isWorkingDay: true, cycle: "14", dayOrder: "IV", count: "82" },
  { dateStr: "2026-10-08", isWorkingDay: true, cycle: "14", dayOrder: "V", count: "83" },
  { dateStr: "2026-10-09", isWorkingDay: true, cycle: "14", dayOrder: "VI", count: "84" },
  { dateStr: "2026-10-10", isWorkingDay: true, cycle: "15", dayOrder: "I", count: "85" },
  { dateStr: "2026-10-11", isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" },
  { dateStr: "2026-10-12", isWorkingDay: true, cycle: "15", dayOrder: "II", count: "86" },
  { dateStr: "2026-10-13", isWorkingDay: true, cycle: "15", dayOrder: "III", count: "87" },
  { dateStr: "2026-10-14", isWorkingDay: true, cycle: "15", dayOrder: "IV", count: "88" },
  { dateStr: "2026-10-15", isWorkingDay: true, cycle: "15", dayOrder: "V", count: "89" },
  { dateStr: "2026-10-16", isWorkingDay: true, cycle: "15", dayOrder: "VI", count: "90" }
];

export default function CalendarPage() {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, CalendarDay>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const snap = await getDocs(collection(db, "academicCalendar"));
        let data: CalendarDay[] = [];
        
        if (snap.empty) {
          // Seed initial data
          data = INITIAL_DATA;
          for (const d of data) {
            await setDoc(doc(db, "academicCalendar", d.dateStr), d);
          }
        } else {
          data = snap.docs.map(d => ({ dateStr: d.id, ...d.data() } as CalendarDay));
          // Sort chronologically by date
          data.sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
        }
        
        setDays(data);
        
        const initialEdits: Record<string, CalendarDay> = {};
        for (const d of data) {
          initialEdits[d.dateStr] = { ...d };
        }
        setEdits(initialEdits);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load calendar data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (dateStr: string, field: keyof CalendarDay, value: string | boolean) => {
    setEdits(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value
      }
    }));
  };

  const handleToggleWorkingDay = (dateStr: string, val: boolean) => {
    setEdits(prev => {
      const cur = prev[dateStr];
      if (!val) {
        return { ...prev, [dateStr]: { ...cur, isWorkingDay: false, cycle: "-", dayOrder: "-", count: "-" } };
      } else {
        return { ...prev, [dateStr]: { ...cur, isWorkingDay: true } };
      }
    });
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      for (const [dateStr, data] of Object.entries(edits)) {
        await setDoc(doc(db, "academicCalendar", dateStr), data);
      }
      setDays(Object.values(edits).sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime()));
      toast.success("Calendar updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDirty = JSON.stringify(days) !== JSON.stringify(Object.values(edits));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Academic Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage working days, cycles, day orders, and day counts.</p>
        </div>
        <Button onClick={saveChanges} disabled={!isDirty || saving} className="rounded-xl">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Day Order</TableHead>
              <TableHead>Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((d) => {
              const edit = edits[d.dateStr];
              if (!edit) return null;
              
              const dateObj = new Date(d.dateStr);
              const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <TableRow key={d.dateStr} className={!edit.isWorkingDay ? "bg-muted/30" : ""}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formattedDate} <span className="text-xs text-muted-foreground ml-2">{dayName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={edit.isWorkingDay} 
                        onCheckedChange={(val) => handleToggleWorkingDay(d.dateStr, val)} 
                      />
                      {edit.isWorkingDay ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">Working Day</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">Holiday</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={edit.cycle} 
                      onChange={(e) => handleChange(d.dateStr, "cycle", e.target.value)}
                      disabled={!edit.isWorkingDay}
                      className="w-20 rounded-lg text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={edit.dayOrder} 
                      onChange={(e) => handleChange(d.dateStr, "dayOrder", e.target.value)}
                      disabled={!edit.isWorkingDay}
                      className="w-20 rounded-lg text-center font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={edit.count} 
                      onChange={(e) => handleChange(d.dateStr, "count", e.target.value)}
                      disabled={!edit.isWorkingDay}
                      className="w-20 rounded-lg text-center"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
