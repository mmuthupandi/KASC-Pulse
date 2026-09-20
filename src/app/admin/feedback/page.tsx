"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bug, Lightbulb, MessageSquare, Trash2, Paperclip, Eye, DownloadCloud, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from "firebase/firestore";

interface Feedback {
  id: string;
  type: "bug" | "feature" | "general";
  message: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  attachmentName: string | null;
  attachmentData: string | null;
  createdAt: any;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
      setFeedbacks(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Failed to load feedback");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete/resolve this feedback?")) return;
    try {
      await deleteDoc(doc(db, "feedback", id));
      toast.success("Feedback resolved and removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete feedback.");
    }
  };

  const downloadAttachment = (req: Feedback) => {
    if (!req.attachmentData) return;
    const link = document.createElement('a');
    link.href = req.attachmentData;
    link.download = req.attachmentName || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewAttachment = (req: Feedback) => {
    if (!req.attachmentData) return;
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
      
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error("Error viewing attachment", e);
      toast.error("Could not preview file.");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug className="h-4 w-4 text-rose-500" />;
      case "feature": return <Lightbulb className="h-4 w-4 text-amber-500" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Feedback & Bugs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review bug reports and feature requests from users.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {feedbacks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">All clear!</h3>
            <p>No feedback or bug reports pending.</p>
          </div>
        ) : (
          feedbacks.map((f) => (
            <Card key={f.id} className="flex flex-col p-5 overflow-hidden relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-muted/50">
                    {getIcon(f.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize text-sm">{f.type}</h3>
                    <p className="text-xs text-muted-foreground">
                      {f.createdAt?.toDate ? new Date(f.createdAt.toDate()).toLocaleString() : "Just now"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(f.id)}
                  title="Delete / Mark as Resolved"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1">
                <p className="text-sm whitespace-pre-wrap">{f.message}</p>
              </div>

              {f.attachmentData && (
                <div className="mt-4 flex items-center justify-between gap-3 text-sm bg-muted/30 p-2 rounded-lg border">
                  <div className="flex items-center gap-1.5 text-muted-foreground overflow-hidden">
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span className="font-medium truncate text-xs" title={f.attachmentName || ""}>
                      {f.attachmentName || "Screenshot"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 border-l pl-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => viewAttachment(f)} title="View File">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => downloadAttachment(f)} title="Download File">
                      <DownloadCloud className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{f.userName}</span>
                <span>•</span>
                <span className="uppercase">{f.userRole}</span>
                <span>•</span>
                <span className="truncate max-w-[150px]">{f.userEmail}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
