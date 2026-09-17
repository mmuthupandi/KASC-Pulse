"use client";
import { AppShell } from "@/components/app-shell";

export default function HodShell({ children }: { children: React.ReactNode }) {
  return <AppShell role="hod">{children}</AppShell>;
}
