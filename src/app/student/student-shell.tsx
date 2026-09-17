"use client";
import { AppShell } from "@/components/app-shell";

export default function StudentShell({ children }: { children: React.ReactNode }) {
  return <AppShell role="student">{children}</AppShell>;
}
