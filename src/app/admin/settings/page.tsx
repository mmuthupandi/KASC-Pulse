"use client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Shield, Smartphone, Globe, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure global system settings and notification preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Alerts</Label>
                <div className="text-sm text-muted-foreground">Send daily attendance summary via email.</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <div className="text-sm text-muted-foreground">Notify parents for continuous absence.</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <div className="text-sm text-muted-foreground">Enable in-app push notifications.</div>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Security & Access</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <div className="text-sm text-muted-foreground">Disable non-admin logins temporarily.</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication (2FA)</Label>
                <div className="text-sm text-muted-foreground">Require 2FA for all faculty and admins.</div>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Institute Profile</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Institute Name</Label>
              <Input defaultValue="Kongunadu Arts and Science College" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input defaultValue="2026 - 2027" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@kongunaducollege.ac.in" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input defaultValue="Asia/Kolkata (IST)" className="rounded-xl" disabled />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => toast.success("Settings saved successfully")} className="rounded-xl">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
