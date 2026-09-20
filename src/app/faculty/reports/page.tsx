"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, FileText, CheckCircle2, Paperclip, DownloadCloud, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

interface LeaveRequest {
  id: string;
  studentName: string;
  rollNo: string;
  class: string;
  type: string;
  reason: string;
  duration: string;
  fromDate: string;
  toDate: string;
  attachment?: string | null;
  attachmentData?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function FacultyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isTutor = user?.isTutor ?? false;
  const isAdmin = user?.role === "admin";
  const hasAccess = isTutor || isAdmin;

  useEffect(() => {
    // Ideally we would filter by department or class the faculty is assigned to.
    // For now, fetch all leaveRequests and let the faculty manage their students.
    const q = query(collection(db, "leaveRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest));
      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Failed to load leave requests");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const pending = requests.filter(r => r.status === "pending");
  const history = requests.filter(r => r.status !== "pending");

  const handleAction = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "leaveRequests", id), { status: newStatus });
      toast.success(`Request ${newStatus} successfully.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const downloadAttachment = (req: LeaveRequest) => {
    if (!req.attachmentData) {
      toast.error("File data not found (Legacy upload).");
      return;
    }
    const link = document.createElement('a');
    link.href = req.attachmentData;
    link.download = req.attachment || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewAttachment = (req: LeaveRequest) => {
    if (!req.attachmentData) {
      toast.error("File data not found (Legacy upload).");
      return;
    }
    try {
      const arr = req.attachmentData.split(',');
      const match = arr[0].match(/:(.*?);/);
      if (!match) throw new Error("Invalid data URL");
      
      const mime = match[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup object URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error("Error viewing attachment", e);
      toast.error("Could not preview file.");
    }
  };

  if (loading || authLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ── Non-tutor, non-admin: no access ─────────────────────────────────────
  if (user && !hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Leave approvals & reporting</p>
        </div>
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Restricted Access</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Student leave approvals and class-wide reports are only accessible to Class Tutors.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Leave Approvals & Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and manage student leave requests.</p>
      </div>

      {/* Pending Requests */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 border-b pb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Pending Requests ({pending.length})</h2>
        </div>
        
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
            <p>You're all caught up!</p>
            <p className="text-sm">No pending leave requests require your attention.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <div key={req.id} className="rounded-xl border p-4 transition-colors hover:bg-muted/30 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{req.studentName}</span>
                    <Badge variant="secondary" className="font-mono text-xs">{req.rollNo}</Badge>
                    <Badge variant="outline" className="text-xs bg-primary/5">{req.class}</Badge>
                  </div>
                  <div className="text-sm font-medium">Duration: <span className="text-muted-foreground font-normal">{req.duration}</span></div>
                  <div className="text-sm mt-1 bg-muted/40 p-3 rounded-lg border">
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Reason</span>
                    {req.reason}
                  </div>
                  {req.attachment && (
                    <div className="mt-3 flex items-center gap-3 text-sm bg-muted/20 p-2 rounded-lg border w-fit">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        <span className="font-medium truncate max-w-[150px]" title={req.attachment}>{req.attachment}</span>
                      </div>
                      
                      {req.attachmentData ? (
                        <div className="flex items-center gap-1 border-l pl-3 ml-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-primary hover:bg-primary/10" 
                            onClick={() => viewAttachment(req)}
                            title="View File"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-primary hover:bg-primary/10"
                            onClick={() => downloadAttachment(req)}
                            title="Download File"
                          >
                            <DownloadCloud className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 border-l pl-3 ml-1">Mock upload</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0 md:flex-col lg:flex-row">
                  <Button 
                    onClick={() => handleAction(req.id, "approved")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto"
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button 
                    onClick={() => handleAction(req.id, "rejected")}
                    variant="outline"
                    className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 w-full md:w-auto"
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* History */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Resolved History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No historical requests found.</TableCell>
              </TableRow>
            ) : (
              history.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.studentName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{req.rollNo}</div>
                  </TableCell>
                  <TableCell className="text-sm">{req.duration}</TableCell>
                  <TableCell className="text-sm max-w-[300px] truncate" title={req.reason}>
                    {req.reason}
                    {req.attachment && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{req.attachment}</span>
                        </div>
                        {req.attachmentData && (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-primary" 
                              onClick={() => viewAttachment(req)}
                              title="View"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-primary" 
                              onClick={() => downloadAttachment(req)}
                              title="Download"
                            >
                              <DownloadCloud className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        req.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
