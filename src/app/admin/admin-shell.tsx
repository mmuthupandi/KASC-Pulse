"use client";
import { AppShell } from "@/components/app-shell";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return <AppShell role="admin">{children}</AppShell>;
}
