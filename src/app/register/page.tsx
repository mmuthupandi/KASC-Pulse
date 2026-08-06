"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() { return <Register />; }

function Register() {
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-background p-6 md:p-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">KASC Pulse</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join your college's attendance workspace.</p>

          <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "faculty" | "admin")} className="mt-6">
            <TabsList className="grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="student" className="rounded-lg">Student</TabsTrigger>
              <TabsTrigger value="faculty" className="rounded-lg">Faculty</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" placeholder="Your name" className="h-11 rounded-xl pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@kasc.ac.in" className="h-11 rounded-xl pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="At least 8 characters" className="h-11 rounded-xl pl-9" />
              </div>
            </div>
            <Button asChild size="lg" className="h-11 w-full rounded-xl">
              <Link href={`/${role}`}>
                Create account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-700 p-10 text-primary-foreground lg:block">
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 flex h-full flex-col justify-center">
          <h2 className="max-w-md text-4xl font-semibold leading-tight">One workspace for your entire academic life.</h2>
          <p className="mt-4 max-w-md text-white/80">Attendance, timetables, leave requests, and reports — all in one beautiful dashboard.</p>
        </motion.div>
      </div>
    </div>
  );
}