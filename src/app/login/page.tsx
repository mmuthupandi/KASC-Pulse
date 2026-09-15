"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KASCHeader } from "@/components/kasc-header";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function Page() { return <Login />; }

function Login() {
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify role in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== role) {
          toast.error(`You are registered as a ${userData.role}, not a ${role}.`);
          auth.signOut();
          setIsLoading(false);
          return;
        }
      }

      toast.success("Welcome back!");
      router.push(`/${role}`);
    } catch (error: any) {
      toast.error("Invalid credentials or account does not exist.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <KASCHeader />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-700 p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">KASC Pulse</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 space-y-4"
          >
            <h2 className="text-4xl font-semibold leading-tight">
              The attendance workspace your campus deserves.
            </h2>
            <p className="max-w-md text-white/80">
              Sign in to view your timetable, mark attendance, and stay on top of every class.
            </p>
            <div className="grid max-w-md gap-3 pt-4">
              {[
                { icon: GraduationCap, t: "Live attendance", d: "Track presence in real time." },
                { icon: Users, t: "Class management", d: "Manage classes, sections, and rosters." },
                { icon: ShieldCheck, t: "Secure & role-based", d: "Every action is permissioned." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <div className="rounded-xl bg-white/15 p-2"><f.icon className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-medium">{f.t}</div>
                    <div className="text-xs text-white/70">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <span className="relative z-10 text-xs text-white/70">© KASC Pulse {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center justify-center bg-background p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-semibold">KASC Pulse</span>
            </Link>

            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>

            <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "faculty" | "admin")} className="mt-6">
              <TabsList className="grid w-full grid-cols-3 rounded-xl">
                <TabsTrigger value="student" className="rounded-lg">Student</TabsTrigger>
                <TabsTrigger value="faculty" className="rounded-lg">Faculty</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-lg">Admin</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@kasc.ac.in" className="h-11 rounded-xl pl-9" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="h-11 rounded-xl pl-9" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" defaultChecked />
                  <Label htmlFor="remember" className="text-sm font-normal">Remember me for 30 days</Label>
                </div>
                <Button type="submit" size="lg" className="h-11 w-full rounded-xl" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign in <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Don't have an account?{" "}
                  <Link href="/register" className="font-medium text-primary hover:underline">
                    Create one
                  </Link>
                </p>
              </form>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}