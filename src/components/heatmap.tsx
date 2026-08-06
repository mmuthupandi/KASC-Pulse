"use client";
import { makeHeatmap } from "@/lib/mock-data";

const grid = makeHeatmap();

const colorFor = (s: string) => {
  switch (s) {
    case "present":
      return "bg-primary";
    case "absent":
      return "bg-destructive";
    case "leave":
      return "bg-warning";
    default:
      return "bg-muted";
  }
};

export function Heatmap() {
  return (
    <div className="space-y-3">
      <div className="flex gap-[3px] overflow-x-auto">
        <div className="mr-1 flex flex-col justify-between py-[2px] text-[10px] text-muted-foreground">
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
        </div>
        <div className="flex flex-col gap-[3px]">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-[3px]">
              {row.map((cell, c) => (
                <div
                  key={c}
                  title={`${cell.date} — ${cell.status}`}
                  className={`h-3 w-3 rounded-[3px] ${colorFor(cell.status)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-destructive" />
          Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-warning" />
          Leave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
          No Class
        </span>
      </div>
    </div>
  );
}