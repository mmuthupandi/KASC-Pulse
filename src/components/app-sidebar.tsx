"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  BookOpen,
  Bell,
  User,
  Settings,
  LogOut,
  Users,
  GraduationCap,
  FileBarChart,
  Building2,
  QrCode,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/mock-data";

const studentNav = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Timetable", url: "/student/timetable", icon: Calendar },
  { title: "Attendance", url: "/student/attendance", icon: ClipboardCheck },
  { title: "Leave Request", url: "/student/leave", icon: FileBarChart },
  { title: "Profile", url: "/student/profile", icon: User },
];

const facultyNav = [
  { title: "Dashboard", url: "/faculty", icon: LayoutDashboard },
  { title: "Take Attendance", url: "/faculty/attendance", icon: QrCode },
  { title: "Students", url: "/faculty/students", icon: Users },
  { title: "Reports", url: "/faculty/reports", icon: FileBarChart },
  { title: "Profile", url: "/faculty/profile", icon: User },
];

const adminNav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: GraduationCap },
  { title: "Faculty", url: "/admin/faculty", icon: Users },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Subjects", url: "/admin/subjects", icon: BookOpen },
  { title: "Reports", url: "/admin/reports", icon: FileBarChart },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const hodNav = [
  { title: "Dashboard", url: "/hod", icon: LayoutDashboard },
  { title: "Approvals", url: "/hod/approvals", icon: ClipboardCheck },
  { title: "Dept Logs", url: "/hod/logs", icon: FileBarChart },
  { title: "Condonation", url: "/hod/condonation", icon: GraduationCap },
  { title: "Profile", url: "/hod/profile", icon: User },
];

const parentNav = [
  { title: "Dashboard", url: "/parent", icon: LayoutDashboard },
  { title: "Profile", url: "/parent/profile", icon: User },
];

export function AppBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items =
    role === "student"
      ? studentNav
      : role === "faculty"
        ? facultyNav
        : role === "parent"
          ? parentNav
          : role === "hod"
            ? hodNav
            : adminNav;

  // On very small screens, 7 items might be tight, but we'll use overflow-x-auto or let it be compact
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)] md:px-6">
      {items.map((item) => {
        const active =
          item.url === `/${role}`
            ? pathname === item.url
            : pathname === item.url || pathname.startsWith(item.url + "/");
        
        return (
          <Link
            key={item.url}
            href={item.url}
            className={`flex flex-col items-center justify-center gap-1 w-full max-w-[64px] h-full ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/10" : "bg-transparent"}`}>
              <item.icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
            </div>
            <span className="text-[10px] font-medium truncate w-full text-center">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}