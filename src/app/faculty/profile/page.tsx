"use client";
import { useAuth } from "@/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, BookOpen, GraduationCap, MapPin, Edit3, Loader2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function FacultyProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = user.name?.slice(0, 2).toUpperCase() || "FA";
  const department = user.department || "—";
  const designation = user.designation || "—";

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Faculty Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and manage your faculty information.</p>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="h-24 bg-primary sm:h-32"></div>
        <div className="px-4 pb-6 sm:px-6">
          <div className="relative flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background shadow-md bg-white">
              <AvatarFallback className="text-2xl bg-muted text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-xl h-9">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="secondary" className="rounded-md text-xs">{designation}</Badge>
              <span className="text-sm">• {department}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Academic Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Department</div>
                <div className="text-sm text-muted-foreground">{department}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Designation</div>
                <div className="text-sm text-muted-foreground">{designation}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Class Tutor</div>
                <div className="text-sm text-muted-foreground">{user.isTutor ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/20 text-secondary shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Email Address</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/20 text-secondary shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Phone Number</div>
                <div className="text-sm text-muted-foreground">Not provided</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/20 text-secondary shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Office Location</div>
                <div className="text-sm text-muted-foreground">
                  Kongunadu Arts and Science College,<br />GN Mills Post, Coimbatore - 641 029
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="pt-4 flex justify-center">
        <Button
          variant="destructive"
          className="w-full sm:w-auto rounded-xl shadow-sm px-8"
          onClick={async () => {
            await auth.signOut();
            router.push("/login");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out of KASC Pulse
        </Button>
      </div>
    </div>
  );
}
