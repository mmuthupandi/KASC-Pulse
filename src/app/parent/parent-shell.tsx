"use client";
import { AppShell } from "@/components/app-shell";

export default function ParentShell({ children }: { children: React.ReactNode }) {
  return <AppShell role="parent">{children}</AppShell>;
}
