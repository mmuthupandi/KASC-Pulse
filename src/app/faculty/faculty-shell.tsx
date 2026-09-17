"use client";
import { AppShell } from "@/components/app-shell";

export default function FacultyShell({ children }: { children: React.ReactNode }) {
  return <AppShell role="faculty">{children}</AppShell>;
}
