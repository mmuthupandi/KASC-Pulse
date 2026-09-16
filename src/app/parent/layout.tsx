"use client";

import { AppShell } from "@/components/app-shell";
import { LayoutDashboard, User } from "lucide-react";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const parentNavigation = [
    { name: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { name: "Profile", href: "/parent/profile", icon: User },
  ];

  return <AppShell role="parent">{children}</AppShell>;
}
