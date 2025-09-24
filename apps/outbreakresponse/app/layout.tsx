import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import Analytics from "./analytics"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
  title: { default: "OutbreakResponse", template: "%s · OutbreakResponse" },
  description: "U.S. outbreaks, hospitalizations, and food safety recalls with national and New Mexico views. Owned by Civantic LLC."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Analytics />
        <div className="min-h-dvh flex flex-col">
          <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white/70 dark:bg-black/30 border-b border-black/10">
            <div className="container flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                <span>OutbreakResponse</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/#dashboard" className="nav-link">Dashboard</Link>
                <Link href="/nm" className="nav-link">New Mexico</Link>
                <Link href="/map" className="nav-link">Map</Link>
                <Link href="/wastewater" className="nav-link">Wastewater</Link>
                <Link href="/recalls" className="nav-link">Recalls</Link>
                <Link href="/adverse-events" className="nav-link">Adverse Events</Link>
                <Link href="/sources" className="nav-link">Sources</Link>
                <Link href="/roadmap" className="nav-link">Roadmap</Link>
                <Link href="/status" className="nav-link">Status</Link>
                <a href="https://civantic.com" className="nav-link">Civantic</a>
              </nav>
              <div className="flex items-center gap-2">
                <a href="mailto:info@civantic.com" className="btn btn-primary">Contact</a>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-black/10">
            <div className="container py-10 text-sm text-gray-500">
              <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                <p>© {new Date().getFullYear()} OutbreakResponse. Owned by Civantic LLC.</p>
                <div className="flex gap-4">
                  <Link href="/nm" className="hover:underline">New Mexico</Link>
                  <Link href="/map" className="hover:underline">Map</Link>
                  <Link href="/wastewater" className="hover:underline">Wastewater</Link>
                  <Link href="/recalls" className="hover:underline">Recalls</Link>
                  <Link href="/adverse-events" className="hover:underline">Adverse Events</Link>
                  <Link href="/sources" className="hover:underline">Sources</Link>
                  <Link href="/roadmap" className="hover:underline">Roadmap</Link>
                  <Link href="/status" className="hover:underline">Status</Link>
                  <a href="https://civantic.com" className="hover:underline">Civantic</a>
                  <Link href="/sitemap.xml" className="hover:underline">Sitemap</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
