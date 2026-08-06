"use client";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  hint,
  icon,
  accent,
  className,
}: {
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?:
    | "primary"
    | "success"
    | "warning"
    | "destructive"
    | "red"
    | "orange"
    | "yellow"
    | "lime"
    | "green"
    | "teal"
    | "blue"
    | "navy"
    | "magenta"
    | "pink";
  className?: string;
}) {
  const map: Record<string, { icon: string; bar: string }> = {
    primary: { icon: "bg-primary/15 text-primary", bar: "bg-primary" },
    success: { icon: "bg-primary/15 text-primary", bar: "bg-primary" },
    warning: { icon: "bg-warning/20 text-warning", bar: "bg-warning" },
    destructive: { icon: "bg-destructive/15 text-destructive", bar: "bg-destructive" },
    red: { icon: "bg-destructive/15 text-destructive", bar: "bg-destructive" },
    orange: { icon: "bg-warning/15 text-warning", bar: "bg-warning" },
    yellow: { icon: "bg-warning/20 text-warning", bar: "bg-warning" },
    lime: { icon: "bg-secondary/20 text-secondary", bar: "bg-secondary" },
    green: { icon: "bg-primary/15 text-primary", bar: "bg-primary" },
    teal: { icon: "bg-secondary/15 text-secondary", bar: "bg-secondary" },
    blue: { icon: "bg-primary/15 text-primary", bar: "bg-primary" },
    navy: { icon: "bg-primary/15 text-primary", bar: "bg-primary" },
    magenta: { icon: "bg-secondary/15 text-secondary", bar: "bg-secondary" },
    pink: { icon: "bg-destructive/15 text-destructive", bar: "bg-destructive" },
  };
  const tone = map[accent ?? "primary"] ?? map["primary"]!;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className={cn("relative overflow-hidden p-5 shadow-sm", className)}>
        <span className={cn("absolute inset-x-0 top-0 h-1", tone.bar)} />
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
            {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
          </div>
          {icon && <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone.icon)}>{icon}</div>}
        </div>
      </Card>
    </motion.div>
  );
}