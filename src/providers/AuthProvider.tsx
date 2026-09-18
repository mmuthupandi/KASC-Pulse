"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

export interface AppUser {
  uid: string;
  email: string | null;
  role: "student" | "faculty" | "hod" | "admin" | "parent";
  name?: string;
  isTutor?: boolean;
  classId?: string;
  // Student fields
  rollNo?: string;
  department?: string;
  semester?: string;
  stream?: string;
  // Faculty / HOD fields
  designation?: string;
  subjects?: string[]; // subject codes e.g. ["24USC506", "24USC505"]
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<AppUser, "uid" | "email">;
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData,
            });
          } else {
            // Authenticated but no Firestore profile — sign them out and explain
            await auth.signOut();
            setUser(null);
            toast.error("Account not set up yet. Contact your administrator.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          toast.error("Failed to load your profile. Please try again.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
