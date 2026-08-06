"use client";
import { Bell, Search } from "lucide-react";
import type { ReactNode } from "react";
import { AppBottomNav } from "./app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/mock-data";
import { currentUser, facultyUser, adminUser } from "@/lib/mock-data";

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const user = role === "student" ? currentUser : role === "faculty" ? facultyUser : adminUser;
  const subtitle =
    role === "student"
      ? currentUser.department + " · " + currentUser.semester
      : role === "faculty"
        ? facultyUser.department
        : "Administrator";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <img src="https://kongunaducollege.ac.in/sites/kongunaducollege.ac.in/files/colege_logo.webp" alt="Logo" className="h-8 w-8 object-contain" />
        </div>
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students, subjects... (Ctrl+K)"
            className="h-10 w-[320px] rounded-xl pl-9 bg-muted/50"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full p-0 text-[10px]">3</Badge>
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border shadow-sm">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="hidden text-right text-sm leading-tight sm:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <AppBottomNav role={role} />
    </div>
  );
}