import type { Metadata, Viewport } from 'next'
import { Toaster } from "@/components/ui/sonner";
import Providers from "./Providers";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Kongunadu Arts and Science College (Autonomous)",
  description: "Attendance management system for Kongunadu Arts and Science College (KASC), Coimbatore – NAAC A+ Accredited and UGC College of Excellence.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
