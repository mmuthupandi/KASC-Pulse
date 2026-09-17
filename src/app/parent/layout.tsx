export const dynamic = "force-dynamic";

import ParentShell from "./parent-shell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
