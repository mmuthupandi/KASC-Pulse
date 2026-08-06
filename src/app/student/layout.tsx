"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="student">
      {children}
    </AppShell>
  );
}