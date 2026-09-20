"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, MoreHorizontal, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function DepartmentsPage() {
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        const stats: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const dept = doc.data().department;
          if (dept) {
            stats[dept] = (stats[dept] || 0) + 1;
          }
        });
        setDeptStats(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const departments = Object.entries(deptStats).map(([name, count]) => ({
    name: name,
    head: "Dr. K. Senthilkumar", // Mock HOD for UI
    students: count,
    status: "Active"
  }));

  // Fallback if no students yet
  if (departments.length === 0 && !loading) {
     departments.push({ name: "Computer Science", head: "—", students: 0, status: "Active" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage institute departments and assign Heads of Department.</p>
        </div>
        <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      {dept.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HOD</span>
                  <span className="font-medium">{dept.head}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enrolled Students</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {loading ? "..." : dept.students}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" size="sm">Manage</Button>
              <Button variant="outline" className="flex-1 rounded-xl" size="sm">View Staff</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
