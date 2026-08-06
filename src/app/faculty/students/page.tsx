"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudentsTable } from "@/components/students-table";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">All students across your classes.</p>
      </div>
      <StudentsTable />
    </div>
  );
}