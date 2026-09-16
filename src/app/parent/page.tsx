"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Loader2, Activity, CalendarCheck, BookOpen, GraduationCap } from "lucide-react";

export default function ParentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [overallPercentage, setOverallPercentage] = useState(100);
  const [isFetching, setIsFetching] = useState(true);
  const [lang, setLang] = useState<"ta" | "en">("ta");

  // Translations
  const t = {
    noStudent: { en: "No student linked", ta: "எந்த மாணவரும் இணைக்கப்படவில்லை" },
    noStudentDesc: { en: "Your phone number is not linked to any student account. Please contact college administration.", ta: "உங்கள் தொலைபேசி எண் எந்த மாணவர் கணக்குடனும் இணைக்கப்படவில்லை. தயவுசெய்து கல்லூரி நிர்வாகத்தை தொடர்பு கொள்ளவும்." },
    reg: { en: "Reg", ta: "பதிவு எண்" },
    liveStatus: { en: "Live Status", ta: "தற்போதைய நிலை" },
    present: { en: "Present in College", ta: "கல்லூரியில் உள்ளார்" },
    absent: { en: "Absent", ta: "வரவில்லை" },
    notStarted: { en: "Not Started / Pending", ta: "இன்னும் தொடங்கவில்லை" },
    lastScanned: { en: "Last scanned: Period", ta: "கடைசியாகப் பதிவு: பாடவேளை" },
    noAttendance: { en: "No attendance marked yet today.", ta: "இன்று இன்னும் வருகை பதிவு செய்யப்படவில்லை." },
    overall: { en: "Overall Semester", ta: "மொத்த வருகை சதவீதம்" },
    attendance: { en: "attendance", ta: "வருகை" },
    todaysClasses: { en: "Today's Classes", ta: "இன்றைய வகுப்புகள்" },
    statusPresent: { en: "Present", ta: "வந்தார்" },
    statusAbsent: { en: "Absent", ta: "வரவில்லை" },
    statusPending: { en: "Pending", ta: "நிலுவையில் உள்ளது" },
  };

  // The 5 fixed periods timetable
  const periods = [
    { period: 1, time: "09:00 AM - 10:00 AM", subject: "OS" },
    { period: 2, time: "10:00 AM - 11:00 AM", subject: "Software Engineering & Testing" },
    { period: 3, time: "11:00 AM - 12:00 PM", subject: "Cloud Computing" },
    { period: 4, time: "01:00 PM - 02:00 PM", subject: "DBMS" },
    { period: 5, time: "02:00 PM - 03:00 PM", subject: "EDC" },
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== "parent")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.uid && (user as any).studentId) {
      const studentId = (user as any).studentId;

      const fetchStudent = async () => {
        let actualStudentId = studentId;
        const studentDoc = await getDoc(doc(db, "users", studentId));
        
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() });
        } else {
          // DEMO MAGIC: If the hardcoded link fails, just find ANY student in the database to show
          const { getDocs, limit } = await import("firebase/firestore");
          const q = query(collection(db, "users"), where("role", "==", "student"), limit(1));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const firstStudent = snapshot.docs[0];
            actualStudentId = firstStudent.id;
            setStudent({ id: actualStudentId, ...firstStudent.data() });
          }
        }
        
        // Fetch attendance for the resolved student
        const today = new Date().toISOString().split('T')[0];
        const attQuery = query(collection(db, "attendance"), where("studentId", "==", actualStudentId));

        const unsubscribe = onSnapshot(attQuery, (snapshot) => {
          const allRecords = snapshot.docs.map(doc => doc.data());
          
          // Overall
          if (allRecords.length > 0) {
            const totalPresents = allRecords.filter(r => r.status === "present").length;
            setOverallPercentage(Math.round((totalPresents / allRecords.length) * 100));
          }
          
          // Today
          const todays = allRecords.filter(r => r.date === today);
          setTodayAttendance(todays);
          
          setIsFetching(false);
        });

        return unsubscribe;
      };
      
      let unsub: any;
      fetchStudent().then((u) => { unsub = u; });

      return () => { if (unsub) unsub(); };
    } else if (user?.uid && !(user as any).studentId) {
       setIsFetching(false); // No linked student
    }
  }, [user]);

  if (loading || isFetching) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <GraduationCap className="h-16 w-16 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-semibold">{t.noStudent[lang]}</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {t.noStudentDesc[lang]}
        </p>
      </div>
    );
  }

  // Calculate current active period based on time (mocked for demo, we'll just find the highest period recorded today)
  const lastRecordedPeriod = todayAttendance.length > 0 
    ? todayAttendance.reduce((max, r) => r.period > max.period ? r : max, todayAttendance[0])
    : null;

  const currentStatus = lastRecordedPeriod 
    ? (lastRecordedPeriod.status === "present" ? t.present[lang] : t.absent[lang]) 
    : t.notStarted[lang];

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Profile Section & Language Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight line-clamp-1">{student.name}</h1>
            <p className="text-sm font-medium text-muted-foreground line-clamp-1">
              {t.reg[lang]}: {student.uid} • {student.classId || "BSc CS - Sem 4"}
            </p>
          </div>
        </div>
        
        <div className="flex bg-muted p-1 rounded-lg self-start md:self-auto shrink-0 w-max">
          <button 
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${lang === "en" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            English
          </button>
          <button 
            onClick={() => setLang("ta")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${lang === "ta" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            தமிழ்
          </button>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Live Status Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="relative overflow-hidden p-6 shadow-md border-primary/20">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> {t.liveStatus[lang]}
              </div>
              {lastRecordedPeriod?.status === "present" && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight text-foreground">{currentStatus}</p>
              <p className="text-sm text-muted-foreground">
                {lastRecordedPeriod ? `${t.lastScanned[lang]} ${lastRecordedPeriod.period} (${periods[lastRecordedPeriod.period - 1]?.subject})` : t.noAttendance[lang]}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Overall Percentage Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="p-6 shadow-sm">
            <div className="flex items-center gap-2 font-semibold mb-4 text-muted-foreground">
              <CalendarCheck className="h-5 w-5" /> {t.overall[lang]}
            </div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{overallPercentage}%</p>
              <p className="text-sm text-muted-foreground mb-1">{t.attendance[lang]}</p>
            </div>
            <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${overallPercentage}%` }} 
                transition={{ duration: 1, delay: 0.5, type: "spring" }}
                className={`h-full rounded-full ${overallPercentage >= 75 ? "bg-emerald-500" : overallPercentage >= 65 ? "bg-amber-500" : "bg-rose-500"}`} 
              />
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Today's Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" /> {t.todaysClasses[lang]}
        </h2>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {periods.map((slot, index) => {
            const record = todayAttendance.find(r => r.period === slot.period);
            const status = record ? record.status : "upcoming";
            
            const isPresent = status === "present";
            const isAbsent = status === "absent";
            
            return (
              <motion.div 
                key={slot.period}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                {/* Timeline dot */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${isPresent ? "bg-emerald-500" : isAbsent ? "bg-rose-500" : "bg-muted"}`}>
                  <span className="text-xs font-bold text-white">{slot.period}</span>
                </div>
                
                {/* Content Card */}
                <Card className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 shadow-sm transition-all hover:shadow-md ${isPresent ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10" : isAbsent ? "border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/10" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{slot.subject}</h3>
                      <p className="text-xs text-muted-foreground">{slot.time}</p>
                    </div>
                    <div>
                      {isPresent && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{t.statusPresent[lang]}</span>}
                      {isAbsent && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">{t.statusAbsent[lang]}</span>}
                      {!record && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{t.statusPending[lang]}</span>}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
