"use client";
import { adminUser } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, BookOpen, GraduationCap, MapPin, Edit3, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminProfilePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Admin Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your administrator account.</p>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="h-24 bg-primary sm:h-32"></div>
        <div className="px-4 pb-6 sm:px-6">
          <div className="relative flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background shadow-md bg-white">
              <AvatarImage src={adminUser.avatar} className="object-cover" />
              <AvatarFallback className="text-2xl">{adminUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="rounded-xl h-9">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">{adminUser.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="secondary" className="rounded-md font-mono text-xs">System Administrator</Badge>
              <span className="text-sm">• Principal's Office</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">Role Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Access Level</div>
                <div className="text-sm text-muted-foreground">Full System Access</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Department Focus</div>
                <div className="text-sm text-muted-foreground">All Departments (Institute-wide)</div>
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
                <div className="text-sm font-medium">Official Email Address</div>
                <div className="text-sm text-muted-foreground">{adminUser.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/20 text-secondary shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Office Phone</div>
                <div className="text-sm text-muted-foreground">+91 422 2642095</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
