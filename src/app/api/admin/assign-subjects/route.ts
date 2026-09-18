import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export interface AssignSubjectsInput {
  facultyUid: string;
  subjects: string[]; // subject codes e.g. ["24USC506", "24USC505"]
  isTutor?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: AssignSubjectsInput = await req.json();
    const { facultyUid, subjects, isTutor } = body;

    if (!facultyUid || !Array.isArray(subjects)) {
      return NextResponse.json({ error: "facultyUid and subjects array are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("users").doc(facultyUid);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Faculty user not found" }, { status: 404 });
    }
    if (snap.data()?.role !== "faculty") {
      return NextResponse.json({ error: "User is not a faculty member" }, { status: 400 });
    }

    const update: Record<string, unknown> = { subjects };
    if (isTutor !== undefined) update.isTutor = isTutor;

    await ref.update(update);

    return NextResponse.json({ success: true, facultyUid, subjects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: fetch all faculty with their assigned subjects
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("users").where("role", "==", "faculty").get();
    const faculty = snap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    }));
    return NextResponse.json({ faculty });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
