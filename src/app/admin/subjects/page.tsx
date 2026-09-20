"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, Plus, MoreHorizontal } from "lucide-react";

const ALL_SUBJECTS = [
  { code: "24USC506", name: "Operating Systems", short: "OS", type: "Core", sem: "V" },
  { code: "24USC505", name: "Software Engineering & Testing", short: "SE", type: "Core", sem: "V" },
  { code: "24USC5E1", name: "Cloud Computing", short: "CC", type: "Elective", sem: "V" },
  { code: "24USC507", name: "Database Management System", short: "DBMS", type: "Core", sem: "V" },
  { code: "24USC5CP", name: "DBMS Lab", short: "Lab", type: "Practical", sem: "V" },
  { code: "EDC", name: "Extra Departmental Course", short: "EDC", type: "EDC", sem: "V" },
];

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage institute subjects, codes, and curriculum mappings.</p>
        </div>
        <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search subjects..." className="h-10 w-64 rounded-xl pl-9" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Short</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_SUBJECTS.map((s, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{s.code}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell>{s.short}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={s.type === "Core" ? "bg-primary/5 border-primary/20 text-primary" : ""}>
                    {s.type}
                  </Badge>
                </TableCell>
                <TableCell>{s.sem}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
