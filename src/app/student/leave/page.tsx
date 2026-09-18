"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";

export default function Page() { return <LeavePage />; }

function LeavePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leaveRequests"), where("studentId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setFetching(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async () => {
    if (!reason || !fromDate || !toDate) {
      toast.error("Please fill all required fields");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("From Date cannot be later than To Date");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      // Calculate duration
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      await addDoc(collection(db, "leaveRequests"), {
        studentName: user.name || "Student",
        rollNo: user.rollNo || "Unknown",
        class: user.department || "Unknown",
        type: "Leave",
        reason,
        duration: `${fromDate} to ${toDate} (${diffDays} Days)`,
        fromDate,
        toDate,
        status: "pending",
        attachment: null, // mocked for now
        studentId: user.uid,
        createdAt: new Date().toISOString()
      });
      
      toast.success("Leave request submitted", { description: "You'll be notified once it's reviewed." });
      setReason("");
      setFromDate("");
      setToDate("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Leave Request</h1>
        <p className="mt-1 text-sm text-muted-foreground">Apply for leave and track pending requests.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-4 font-semibold">New Request</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for leave..."
                className="min-h-24 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>From *</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>To *</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Attachment</Label>
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted/40">
                <Upload className="mb-2 h-5 w-5" />
                Click to upload or drag &amp; drop
              </div>
            </div>
            <Button
              className="h-11 w-full rounded-xl"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Request"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Leave History</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetching && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              )}
              {!fetching && history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leave history found.</TableCell>
                </TableRow>
              )}
              {!fetching && history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.reason}</TableCell>
                  <TableCell>{row.fromDate}</TableCell>
                  <TableCell>{row.toDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        row.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : row.status === "rejected"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}