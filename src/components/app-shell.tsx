"use client";
import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppBottomNav } from "./app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/mock-data";
import { useAuth } from "@/providers/AuthProvider";
import { auth } from "@/lib/firebase";

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const name = user?.name || "Loading...";

  const subtitle =
    role === "student"
      ? [user?.department, user?.semester].filter(Boolean).join(" · ") || "Student"
      : role === "faculty"
        ? [user?.department, user?.designation].filter(Boolean).join(" · ") || "Faculty"
        : role === "hod"
          ? "Computer Science Dept. · HOD"
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 pr-3 rounded-full transition-colors">
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="hidden text-right text-sm leading-tight sm:block">
                  <div className="font-medium truncate max-w-[150px]">{name}</div>
                  <div className="text-xs text-muted-foreground">{subtitle}</div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${role}/profile`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${role}/settings`)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  await auth.signOut();
                  router.push("/login");
                }}
                className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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