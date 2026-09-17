export const dynamic = "force-dynamic";

import HodShell from "./hod-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HodShell>{children}</HodShell>;
}
