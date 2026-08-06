"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion } from "motion/react";
import { GraduationCap, Users, ShieldCheck, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Page() { return <Landing />; }

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-[100vw]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-semibold sm:inline-block">KASC Pulse</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" className="rounded-xl px-2 sm:px-4">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl px-3 sm:px-4">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              Modern university ERP · Attendance reimagined
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight md:text-6xl break-words">
              Attendance, timetables and reports —{" "}
              <span className="text-primary">
                beautifully unified
              </span>
              .
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              KASC Pulse gives students, faculty, and administrators a premium, mobile-first
              workspace to manage every class, every day.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl w-full sm:w-auto">
                <Link href="/login">
                  Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl w-full sm:w-auto">
                <Link href="/student">Explore as student</Link>
              </Button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 text-sm text-muted-foreground">
              {["QR + Excel attendance", "Live analytics", "Leave workflows", "Role-based access"].map((f, i) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 text-secondary"
                  />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-2 sm:-inset-6 -z-10 rounded-[2rem] bg-secondary/10 blur-2xl" />
            <Card className="overflow-hidden p-0 shadow-xl">
              <div className="grid grid-cols-3 gap-1 sm:gap-3 border-b bg-muted/30 p-2 sm:p-4">
                <div className="rounded-xl bg-background p-2 sm:p-3 text-center sm:text-left">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Attendance</div>
                  <div className="text-xl sm:text-2xl font-semibold">89%</div>
                </div>
                <div className="rounded-xl bg-background p-2 sm:p-3 text-center sm:text-left">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Attended</div>
                  <div className="text-xl sm:text-2xl font-semibold">74</div>
                </div>
                <div className="rounded-xl bg-background p-2 sm:p-3 text-center sm:text-left">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Missed</div>
                  <div className="text-xl sm:text-2xl font-semibold">9</div>
                </div>
              </div>
              <div className="space-y-3 p-4">
                {[
                  { s: "Data Structures", p: 92 },
                  { s: "Operating Systems", p: 85 },
                  { s: "Database Management", p: 88 },
                  { s: "Computer Networks", p: 90 },
                ].map((r, i) => (
                  <div key={r.s}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span>{r.s}</span>
                      <span className="text-muted-foreground">{r.p}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.p}%`,
                          background: `var(--color-${["primary", "secondary", "primary", "secondary"][i]})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            { icon: GraduationCap, title: "For Students", desc: "Track attendance, view timetable, apply leave, and download reports." },
            { icon: Users, title: "For Faculty", desc: "Take attendance in seconds with QR, Excel upload, or one-tap toggles." },
            { icon: ShieldCheck, title: "For Admins", desc: "Manage students, faculty, departments and monitor institution-wide analytics." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
            >
              <Card className="relative h-full overflow-hidden p-6">
                <span
                  className="absolute inset-x-0 top-0 h-1 bg-primary"
                />
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
