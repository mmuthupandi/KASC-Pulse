"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload } from "lucide-react";
import { leaveHistory } from "@/lib/mock-data";

export default function Page() { return <LeavePage />; }

function LeavePage() {
  const [reason, setReason] = useState("");
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
              <Label>Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for leave..."
                className="min-h-24 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>From</Label>
                <Input type="date" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input type="date" className="h-11 rounded-xl" />
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
              onClick={() => {
                toast.success("Leave request submitted", { description: "You'll be notified once it's reviewed." });
                setReason("");
              }}
            >
              Submit Request
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
              {leaveHistory.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.reason}</TableCell>
                  <TableCell>{row.from}</TableCell>
                  <TableCell>{row.to}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        row.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
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