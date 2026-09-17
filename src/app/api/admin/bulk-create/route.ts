import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export interface BulkUserInput {
  name: string;
  email: string;
  password: string;
  role: "student" | "faculty";
  // Student fields
  rollNo?: string;
  department?: string;
  semester?: string;
  stream?: string;
  // Faculty fields
  designation?: string;
  isTutor?: boolean;
}

export interface BulkCreateResult {
  email: string;
  name: string;
  status: "success" | "error";
  uid?: string;
  error?: string;
}

const FRIENDLY: Record<string, string> = {
  "The email address is already in use by another account.": "Email already registered",
  "The email address is improperly formatted.": "Invalid email address",
  "The password must be a string with at least 6 characters.": "Password too short (min 6 chars)",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const users: BulkUserInput[] = body.users;

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "No users provided" }, { status: 400 });
    }
    if (users.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 users per batch. Please split into smaller batches." },
        { status: 400 }
      );
    }

    const results: BulkCreateResult[] = [];
    const batch = getAdminDb().batch();
    const successEntries: Array<{ uid: string; data: Record<string, unknown> }> = [];

    for (const u of users) {
      // Validate
      if (!u.name?.trim() || !u.email?.trim() || !u.password?.trim()) {
        results.push({
          email: u.email ?? "",
          name: u.name ?? "",
          status: "error",
          error: "Missing required fields (name, email, password)",
        });
        continue;
      }
      if (u.password.length < 8) {
        results.push({
          email: u.email,
          name: u.name,
          status: "error",
          error: "Password must be at least 8 characters",
        });
        continue;
      }

      try {
        // Create Firebase Auth user via Admin SDK
        const userRecord = await getAdminAuth().createUser({
          email: u.email.trim().toLowerCase(),
          password: u.password,
          displayName: u.name.trim(),
        });

        // Build Firestore document
        const userData: Record<string, unknown> = {
          name: u.name.trim(),
          email: u.email.trim().toLowerCase(),
          role: u.role,
          createdAt: new Date().toISOString(),
        };

        if (u.role === "student") {
          if (u.rollNo) userData.rollNo = u.rollNo.trim().toUpperCase();
          if (u.department) userData.department = u.department.trim();
          if (u.semester) userData.semester = u.semester.trim();
          if (u.stream) userData.stream = u.stream.trim();
        }
        if (u.role === "faculty") {
          if (u.department) userData.department = u.department.trim();
          if (u.designation) userData.designation = u.designation.trim();
          userData.isTutor = u.isTutor ?? false;
        }

        const ref = getAdminDb().collection("users").doc(userRecord.uid);
        batch.set(ref, userData);
        successEntries.push({ uid: userRecord.uid, data: userData });

        results.push({ email: u.email, name: u.name, status: "success", uid: userRecord.uid });
      } catch (err: unknown) {
        const raw = err instanceof Error ? err.message : "Unknown error";
        results.push({
          email: u.email,
          name: u.name,
          status: "error",
          error: FRIENDLY[raw] ?? raw,
        });
      }
    }

    // Commit all Firestore docs in one batch
    if (successEntries.length > 0) {
      await batch.commit();
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      summary: { total: users.length, success: successCount, failed: errorCount },
      results,
    });
  } catch (err: unknown) {
    console.error("[bulk-create] fatal error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
