"use client";
import { facultyUser } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, BookOpen, GraduationCap, MapPin, Edit3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FacultyProfilePage() {
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
              <AvatarImage src={facultyUser.avatar} className="object-cover" />
              <AvatarFallback className="text-2xl">{facultyUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-xl h-9">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">{facultyUser.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="secondary" className="rounded-md font-mono text-xs">Faculty ID: F-402</Badge>
              <span className="text-sm">• {facultyUser.department}</span>
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
                <div className="text-sm text-muted-foreground">{facultyUser.department}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Stream</div>
                <div className="text-sm text-muted-foreground">{facultyUser.stream}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Designation</div>
                <div className="text-sm text-muted-foreground">Assistant Professor</div>
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
                <div className="text-sm text-muted-foreground">{facultyUser.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/20 text-secondary shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Phone Number</div>
                <div className="text-sm text-muted-foreground">+91 98765 00000</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/20 text-secondary shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Office Location</div>
                <div className="text-sm text-muted-foreground">Staff Room 2, Block A<br/>Kongunadu Arts and Science College</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
