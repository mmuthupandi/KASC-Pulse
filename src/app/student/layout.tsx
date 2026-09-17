export const dynamic = "force-dynamic";

import StudentShell from "./student-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
