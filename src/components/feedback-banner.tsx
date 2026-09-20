"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bug, Lightbulb, MessageSquare, Megaphone, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

export function FeedbackBanner() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Form State
  const [type, setType] = useState<"bug" | "feature" | "general">("bug");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const isImage = selected.type.startsWith("image/");
      const maxSize = isImage ? 5 * 1024 * 1024 : 700 * 1024;
      
      if (selected.size > maxSize) {
        toast.error(`File is too large (max ${isImage ? "5MB" : "700KB"})`);
        return;
      }
      setFile(selected);
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        if (file.type.startsWith("image/")) {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.6));
          };
          img.onerror = () => resolve(event.target?.result as string); // fallback
        } else {
          resolve(event.target?.result as string); // Not an image, return raw
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please provide a description.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentData = null;
      let attachmentName = null;

      if (file) {
        attachmentData = await toBase64(file);
        attachmentName = file.name;
      }

      await addDoc(collection(db, "feedback"), {
        type,
        message,
        attachmentName,
        attachmentData,
        userId: user?.uid || "unknown",
        userName: user?.name || "Unknown User",
        userRole: user?.role || "unknown",
        userEmail: user?.email || "unknown",
        status: "open",
        createdAt: serverTimestamp(),
      });

      toast.success("Feedback submitted successfully!");
      setOpen(false);
      setMessage("");
      setFile(null);
      setType("bug");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-orange-500/10 border border-violet-500/20 p-3 sm:p-4 cursor-pointer hover:bg-violet-500/5 transition-all group flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/20 p-2 rounded-lg text-violet-600 dark:text-violet-400">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-violet-900 dark:text-violet-100 group-hover:text-violet-700 transition-colors">
              We're in Beta!
            </h4>
            <p className="text-xs sm:text-sm text-violet-700/80 dark:text-violet-300/80">
              Spot a bug or have an idea? Click here to send feedback directly to the admins.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="hidden sm:flex text-violet-600 hover:text-violet-700 hover:bg-violet-500/10 rounded-xl">
          Send Feedback
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve KASC Pulse. Your feedback goes directly to the administrators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Feedback Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <Bug className="h-4 w-4" /> Report a Bug
                    </div>
                  </SelectItem>
                  <SelectItem value="feature">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Lightbulb className="h-4 w-4" /> Request a Feature
                    </div>
                  </SelectItem>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <MessageSquare className="h-4 w-4" /> General Feedback
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Please describe the issue or your idea in detail..." 
                className="min-h-[120px] rounded-xl resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment (Optional)</Label>
              {file ? (
                <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3 gap-2 overflow-hidden w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium block w-full">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full shrink-0" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Paperclip className="w-6 h-6 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> screenshot</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
