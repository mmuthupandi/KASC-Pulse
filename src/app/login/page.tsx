"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, Users, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KASCHeader } from "@/components/kasc-header";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function Page() { return <Login />; }

function Login() {
  const [role, setRole] = useState<"student" | "faculty" | "admin" | "parent">("student");
  
  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Phone Auth State
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${user.role}`);
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return toast.error("Please enter a valid phone number");

    setIsLoading(true);
    // SIMULATED OTP FOR COLLEGE DEMO (Bypasses Firebase Billing Requirement)
    setTimeout(() => {
      setShowOtp(true);
      setIsLoading(false);
      toast.success("OTP sent! (Use 123456 for demo)");
    }, 1000);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");
    
    if (otp !== "123456") {
      return toast.error("Invalid OTP code. Please use 123456.");
    }

    setIsLoading(true);
    try {
      // Under the hood, we use free Email/Password auth to simulate Phone Auth
      const formattedPhone = phone.replace(/\s+/g, '').replace('+', '');
      const fakeEmail = `${formattedPhone}@parent.kasc.ac.in`;
      const fakePassword = "ParentPassword123!";
      
      let userCredential;
      try {
        // Try to sign in
        userCredential = await signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
      } catch (err: any) {
        // If account doesn't exist, create it silently
        userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
      }

      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          role: "parent",
          phone: phone,
          studentId: "crazymuthupandi", 
          createdAt: new Date().toISOString()
        });
      }

      toast.success("Login successful!");
      window.location.href = "/parent";
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred during simulated login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <KASCHeader />
      <div id="recaptcha-container"></div>
      
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-700 p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">KASC Pulse</span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 space-y-4">
            <h2 className="text-4xl font-semibold leading-tight">The attendance workspace your campus deserves.</h2>
            <p className="max-w-md text-white/80">Sign in to view your timetable, mark attendance, and stay on top of every class.</p>
            <div className="grid max-w-md gap-3 pt-4">
              {[
                { icon: GraduationCap, t: "Live attendance", d: "Track presence in real time." },
                { icon: Users, t: "Class management", d: "Manage classes, sections, and rosters." },
                { icon: ShieldCheck, t: "Secure & role-based", d: "Every action is permissioned." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <div className="rounded-xl bg-white/15 p-2"><f.icon className="h-4 w-4" /></div>
                  <div><div className="text-sm font-medium">{f.t}</div><div className="text-xs text-white/70">{f.d}</div></div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <span className="relative z-10 text-xs text-white/70">© KASC Pulse {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center justify-center bg-background p-6 md:p-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
            <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="h-5 w-5" /></div>
              <span className="font-semibold">KASC Pulse</span>
            </Link>

            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>

            <Tabs value={role} onValueChange={(v) => { setRole(v as any); setShowOtp(false); setOtp(""); }} className="mt-6">
              <TabsList className="grid w-full grid-cols-4 rounded-xl">
                <TabsTrigger value="student" className="rounded-lg text-xs md:text-sm">Student</TabsTrigger>
                <TabsTrigger value="parent" className="rounded-lg text-xs md:text-sm">Parent</TabsTrigger>
                <TabsTrigger value="faculty" className="rounded-lg text-xs md:text-sm">Faculty</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-lg text-xs md:text-sm">Admin</TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <motion.div key={role} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  {role === "parent" ? (
                    <form onSubmit={showOtp ? handleVerifyOtp : handleSendOtp} className="mt-6 space-y-4">
                      {!showOtp ? (
                        <div className="space-y-2">
                          <Label htmlFor="phone">Mobile Number</Label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground/80">+91</span>
                            <Input 
                              id="phone" 
                              type="tel" 
                              placeholder="9876543210" 
                              className="h-11 rounded-xl pl-[72px]" 
                              value={phone.replace('+91', '').trim()} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setPhone('+91 ' + val);
                              }} 
                              disabled={isLoading} 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="otp">Enter OTP</Label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input id="otp" type="text" placeholder="123456" maxLength={6} className="h-11 rounded-xl pl-9 text-center tracking-[0.5em]" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isLoading} />
                          </div>
                        </div>
                      )}
                      
                      <Button type="submit" size="lg" className="h-11 w-full rounded-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {!showOtp ? "Send OTP" : "Verify & Login"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      {showOtp && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          <button type="button" onClick={() => setShowOtp(false)} className="font-medium text-primary hover:underline">
                            Use a different number
                          </button>
                        </p>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
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
                          <button type="button" onClick={handleForgotPassword} disabled={isLoading} className="text-xs text-primary hover:underline">Forgot password?</button>
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
                  )}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}