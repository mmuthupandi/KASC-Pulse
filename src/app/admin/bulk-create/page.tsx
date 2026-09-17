"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { BulkUserInput, BulkCreateResult } from "@/app/api/admin/bulk-create/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "student" | "faculty";

interface RowEntry extends BulkUserInput {
  _id: string; // local unique key
  _valid?: boolean;
  _errors?: string[];
}

interface BulkSummary {
  total: number;
  success: number;
  failed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "B.Sc. Computer Science",
  "B.Sc. BioTechnology",
  "B.Com",
  "BCA",
  "B.A. English",
  "M.Sc. Computer Science",
  "M.Com",
];

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const STREAMS = ["Aided", "Un-Aided"];
const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Guest Lecturer",
  "Lab Instructor",
];

const STUDENT_CSV_HEADERS = [
  "name",
  "email",
  "password",
  "rollNo",
  "department",
  "semester",
  "stream",
];
const FACULTY_CSV_HEADERS = [
  "name",
  "email",
  "password",
  "department",
  "designation",
  "isTutor",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function validateRow(row: Partial<RowEntry>): string[] {
  const errors: string[] = [];
  if (!row.name?.trim()) errors.push("Name is required");
  if (!row.email?.trim()) errors.push("Email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push("Invalid email format");
  if (!row.password?.trim()) errors.push("Password is required");
  else if (row.password.length < 8) errors.push("Password must be ≥ 8 characters");
  return errors;
}

function makeBlankStudent(): RowEntry {
  return {
    _id: uid(),
    name: "",
    email: "",
    password: "",
    role: "student",
    rollNo: "",
    department: "",
    semester: "",
    stream: "",
  };
}

function makeBlankFaculty(): RowEntry {
  return {
    _id: uid(),
    name: "",
    email: "",
    password: "",
    role: "faculty",
    department: "",
    designation: "",
    isTutor: false,
  };
}

function parseSheet(rawRows: Record<string, string>[], role: UserRole): RowEntry[] {
  return rawRows
    .filter((r) => r.name || r.email) // skip truly empty rows
    .map((r) => {
      const base: RowEntry = {
        _id: uid(),
        name: r.name?.trim() ?? "",
        email: r.email?.trim().toLowerCase() ?? "",
        password: r.password?.trim() ?? "",
        role,
      };
      if (role === "student") {
        base.rollNo = r.rollNo?.trim().toUpperCase() ?? "";
        base.department = r.department?.trim() ?? "";
        base.semester = r.semester?.trim() ?? "";
        base.stream = r.stream?.trim() ?? "";
      } else {
        base.department = r.department?.trim() ?? "";
        base.designation = r.designation?.trim() ?? "";
        base.isTutor = r.isTutor?.toString().toLowerCase() === "true";
      }
      const errors = validateRow(base);
      base._valid = errors.length === 0;
      base._errors = errors;
      return base;
    });
}

function downloadSampleCSV(role: UserRole) {
  const headers = role === "student" ? STUDENT_CSV_HEADERS : FACULTY_CSV_HEADERS;
  const sampleRows =
    role === "student"
      ? [
          [
            "MUTHUPANDI M",
            "muthupandi@kasc.ac.in",
            "Pass@1234",
            "241SC016",
            "B.Sc. Computer Science",
            "3rd",
            "Un-Aided",
          ],
          [
            "ANGEL JASMINE R",
            "angel@kasc.ac.in",
            "Pass@1234",
            "241SC001",
            "B.Sc. Computer Science",
            "3rd",
            "Aided",
          ],
        ]
      : [
          [
            "Prof. Anjali Verma",
            "anjali.verma@kasc.ac.in",
            "Faculty@123",
            "B.Sc. Computer Science",
            "Assistant Professor",
            "false",
          ],
          [
            "Dr. Ramesh Iyer",
            "ramesh.iyer@kasc.ac.in",
            "Faculty@123",
            "BCA",
            "Associate Professor",
            "true",
          ],
        ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, role === "student" ? "Students" : "Faculty");
  XLSX.writeFile(wb, `kasc_${role}_template.xlsx`);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultsPanel({
  results,
  summary,
  onReset,
}: {
  results: BulkCreateResult[];
  summary: BulkSummary;
  onReset: () => void;
}) {
  const [showFailed, setShowFailed] = useState(true);
  const failed = results.filter((r) => r.status === "error");
  const succeeded = results.filter((r) => r.status === "success");

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{summary.total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </Card>
        <Card className="p-4 text-center border-emerald-200 dark:border-emerald-800">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.success}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Created</div>
        </Card>
        <Card className="p-4 text-center border-rose-200 dark:border-rose-800">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {summary.failed}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Failed</div>
        </Card>
      </div>

      {/* Success list */}
      {succeeded.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-sm">
              {succeeded.length} account{succeeded.length > 1 ? "s" : ""} created successfully
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {succeeded.map((r) => (
              <div
                key={r.uid ?? r.email}
                className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground text-xs">{r.email}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Failed list */}
      {failed.length > 0 && (
        <Card className="p-4 border-rose-200 dark:border-rose-900">
          <button
            className="flex items-center gap-2 w-full text-left mb-2"
            onClick={() => setShowFailed((v) => !v)}
          >
            <XCircle className="h-4 w-4 text-rose-500" />
            <span className="font-medium text-sm">
              {failed.length} account{failed.length > 1 ? "s" : ""} failed
            </span>
            <span className="ml-auto">
              {showFailed ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          </button>
          {showFailed && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {failed.map((r) => (
                <div
                  key={r.email}
                  className="rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground text-xs">{r.email}</span>
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 text-xs mt-0.5">{r.error}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Button onClick={onReset} variant="outline" className="w-full rounded-xl">
        <RefreshCw className="mr-2 h-4 w-4" />
        Start a new batch
      </Button>
    </div>
  );
}

// ─── Manual Entry Tab ─────────────────────────────────────────────────────────

function ManualEntryTab({
  role,
  rows,
  setRows,
  onSubmit,
  isLoading,
  progress,
}: {
  role: UserRole;
  rows: RowEntry[];
  setRows: React.Dispatch<React.SetStateAction<RowEntry[]>>;
  onSubmit: () => void;
  isLoading: boolean;
  progress: number;
}) {
  const addRow = () =>
    setRows((prev) => [...prev, role === "student" ? makeBlankStudent() : makeBlankFaculty()]);

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r._id !== id));

  const update = (id: string, field: keyof RowEntry, value: string | boolean) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, [field]: value };
        const errors = validateRow(updated);
        return { ...updated, _valid: errors.length === 0, _errors: errors };
      })
    );
  };

  const validCount = rows.filter((r) => r._valid).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} row{rows.length !== 1 ? "s" : ""} —{" "}
          <span className="text-emerald-600 dark:text-emerald-400">{validCount} valid</span>
        </p>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Add row
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead className="min-w-[160px]">Full Name *</TableHead>
              <TableHead className="min-w-[200px]">Email *</TableHead>
              <TableHead className="min-w-[140px]">Password *</TableHead>
              {role === "student" && (
                <>
                  <TableHead className="min-w-[110px]">Roll No.</TableHead>
                  <TableHead className="min-w-[200px]">Department</TableHead>
                  <TableHead className="min-w-[100px]">Semester</TableHead>
                  <TableHead className="min-w-[100px]">Stream</TableHead>
                </>
              )}
              {role === "faculty" && (
                <>
                  <TableHead className="min-w-[200px]">Department</TableHead>
                  <TableHead className="min-w-[180px]">Designation</TableHead>
                </>
              )}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row._id}
                className={
                  row._errors && row._errors.length > 0 && row.name
                    ? "bg-rose-50/60 dark:bg-rose-950/20"
                    : ""
                }
              >
                <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                <TableCell>
                  <Input
                    value={row.name}
                    placeholder="Full name"
                    className="h-8 rounded-lg text-sm"
                    onChange={(e) => update(row._id, "name", e.target.value)}
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.email}
                    placeholder="email@kasc.ac.in"
                    className="h-8 rounded-lg text-sm"
                    onChange={(e) => update(row._id, "email", e.target.value)}
                    disabled={isLoading}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="password"
                    value={row.password}
                    placeholder="Min 8 chars"
                    className="h-8 rounded-lg text-sm"
                    onChange={(e) => update(row._id, "password", e.target.value)}
                    disabled={isLoading}
                  />
                </TableCell>
                {role === "student" && (
                  <>
                    <TableCell>
                      <Input
                        value={row.rollNo ?? ""}
                        placeholder="241SC001"
                        className="h-8 rounded-lg text-sm"
                        onChange={(e) => update(row._id, "rollNo", e.target.value)}
                        disabled={isLoading}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.department ?? ""}
                        onValueChange={(v) => update(row._id, "department", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 rounded-lg text-sm">
                          <SelectValue placeholder="Select dept." />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.semester ?? ""}
                        onValueChange={(v) => update(row._id, "semester", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 rounded-lg text-sm">
                          <SelectValue placeholder="Sem" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.stream ?? ""}
                        onValueChange={(v) => update(row._id, "stream", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 rounded-lg text-sm">
                          <SelectValue placeholder="Stream" />
                        </SelectTrigger>
                        <SelectContent>
                          {STREAMS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </>
                )}
                {role === "faculty" && (
                  <>
                    <TableCell>
                      <Select
                        value={row.department ?? ""}
                        onValueChange={(v) => update(row._id, "department", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 rounded-lg text-sm">
                          <SelectValue placeholder="Select dept." />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.designation ?? ""}
                        onValueChange={(v) => update(row._id, "designation", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 rounded-lg text-sm">
                          <SelectValue placeholder="Designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGNATIONS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => removeRow(row._id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={role === "student" ? 9 : 7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No rows yet. Click "Add row" to start.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isLoading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground text-center">Creating accounts… {progress}%</p>
        </div>
      )}

      <Button
        className="w-full rounded-xl h-11"
        disabled={validCount === 0 || isLoading}
        onClick={onSubmit}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Users className="mr-2 h-4 w-4" />
        )}
        Create {validCount > 0 ? validCount : ""} account{validCount !== 1 ? "s" : ""}
      </Button>
    </div>
  );
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

function UploadTab({
  role,
  rows,
  setRows,
  onSubmit,
  isLoading,
  progress,
}: {
  role: UserRole;
  rows: RowEntry[];
  setRows: React.Dispatch<React.SetStateAction<RowEntry[]>>;
  onSubmit: () => void;
  isLoading: boolean;
  progress: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
          const parsed = parseSheet(json, role);
          if (parsed.length === 0) {
            toast.error("No valid rows found in the file.");
            return;
          }
          setRows(parsed);
          toast.success(`Loaded ${parsed.length} rows from ${file.name}`);
        } catch {
          toast.error("Failed to read file. Make sure it's a valid .xlsx or .csv file.");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [role, setRows]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.filter((r) => !r._valid && r.name).length;

  return (
    <div className="space-y-4">
      {/* Download template */}
      <div className="flex items-center justify-between rounded-xl border border-dashed p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <div className="font-medium text-sm">Download sample template</div>
            <div className="text-xs text-muted-foreground">
              Fill in the Excel/CSV template and upload it below
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => downloadSampleCSV(role)}
        >
          <Download className="mr-2 h-4 w-4" />
          Template
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <Upload className={`h-8 w-8 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <div className="text-center">
          <div className="font-medium text-sm">
            {dragging ? "Drop your file here" : "Click or drag & drop"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Supports .xlsx, .xls, and .csv — up to 500 rows
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{rows.length} rows loaded</span>
              {validCount > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  {validCount} valid
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
                  {invalidCount} errors
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg text-muted-foreground"
              onClick={() => setRows([])}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  {role === "student" && <TableHead>Roll No.</TableHead>}
                  {role === "student" && <TableHead>Dept.</TableHead>}
                  {role === "faculty" && <TableHead>Dept.</TableHead>}
                  {role === "faculty" && <TableHead>Designation</TableHead>}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    key={row._id}
                    className={
                      !row._valid && row.name ? "bg-rose-50/60 dark:bg-rose-950/20" : ""
                    }
                  >
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-sm">{row.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.email || "—"}</TableCell>
                    {role === "student" && (
                      <TableCell className="text-sm font-mono">{row.rollNo || "—"}</TableCell>
                    )}
                    <TableCell className="text-sm">{row.department || "—"}</TableCell>
                    {role === "faculty" && (
                      <TableCell className="text-sm">{row.designation || "—"}</TableCell>
                    )}
                    <TableCell>
                      {row._valid ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 text-xs cursor-help"
                          title={row._errors?.join(", ")}
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {row._errors?.[0] ?? "Invalid"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground text-center">Creating accounts… {progress}%</p>
        </div>
      )}

      {rows.length > 0 && (
        <Button
          className="w-full rounded-xl h-11"
          disabled={validCount === 0 || isLoading}
          onClick={onSubmit}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Create {validCount} account{validCount !== 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BulkCreatePage() {
  const [role, setRole] = useState<UserRole>("student");
  const [inputMode, setInputMode] = useState<"upload" | "manual">("upload");
  const [rows, setRows] = useState<RowEntry[]>([makeBlankStudent()]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkCreateResult[] | null>(null);
  const [summary, setSummary] = useState<BulkSummary | null>(null);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setRows(newRole === "student" ? [makeBlankStudent()] : [makeBlankFaculty()]);
    setResults(null);
    setSummary(null);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r._valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to submit.");
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      // Simulate progress while waiting
      const ticker = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 85));
      }, 400);

      const payload: BulkUserInput[] = validRows.map(({ _id, _valid, _errors, ...rest }) => rest);

      const res = await fetch("/api/admin/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: payload }),
      });

      clearInterval(ticker);
      setProgress(100);

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Server error during bulk creation.");
        return;
      }

      setResults(data.results);
      setSummary(data.summary);

      if (data.summary.success > 0) {
        toast.success(`${data.summary.success} account${data.summary.success > 1 ? "s" : ""} created!`);
      }
      if (data.summary.failed > 0) {
        toast.warning(`${data.summary.failed} account${data.summary.failed > 1 ? "s" : ""} failed. Check the results.`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setSummary(null);
    setProgress(0);
    setRows(role === "student" ? [makeBlankStudent()] : [makeBlankFaculty()]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Bulk Account Creation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create Firebase Auth accounts + Firestore profiles for students and staff in one go.
          Supports up to 500 users per batch.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex gap-3">
        <button
          onClick={() => handleRoleChange("student")}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
            role === "student"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Students
        </button>
        <button
          onClick={() => handleRoleChange("faculty")}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
            role === "faculty"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          Faculty / Staff
        </button>
      </div>

      {/* Info banner */}
      <Card className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Before you proceed:</strong> Make sure your{" "}
          <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-[11px]">.env.local</code>{" "}
          file contains{" "}
          <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-[11px]">
            FIREBASE_PROJECT_ID
          </code>
          ,{" "}
          <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-[11px]">
            FIREBASE_CLIENT_EMAIL
          </code>
          , and{" "}
          <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-[11px]">
            FIREBASE_PRIVATE_KEY
          </code>{" "}
          from your Firebase service account. The API route uses the Admin SDK — these credentials
          are never exposed to the browser.
        </p>
      </Card>

      {/* Results panel OR input panel */}
      {results && summary ? (
        <ResultsPanel results={results} summary={summary} onReset={handleReset} />
      ) : (
        <Tabs
          value={inputMode}
          onValueChange={(v) => {
            setInputMode(v as "upload" | "manual");
            setRows(role === "student" ? [makeBlankStudent()] : [makeBlankFaculty()]);
          }}
        >
          <TabsList className="rounded-xl">
            <TabsTrigger value="upload" className="rounded-lg">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="manual" className="rounded-lg">
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <UploadTab
              role={role}
              rows={rows}
              setRows={setRows}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              progress={progress}
            />
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <ManualEntryTab
              role={role}
              rows={rows}
              setRows={setRows}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              progress={progress}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
