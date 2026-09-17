export const dynamic = "force-dynamic";

import FacultyShell from "./faculty-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FacultyShell>{children}</FacultyShell>;
}
