"use client";
import { FacultyTable } from "@/components/faculty-table";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Faculty Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage institute faculty, designations, and department mappings.</p>
      </div>
      <FacultyTable />
    </div>
  );
}
