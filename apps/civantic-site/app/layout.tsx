import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import Image from "next/image"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL("https://civanticllc.com"),
  title: { default: "Public Health, Food Safety & Health Administration | Civantic LLC", template: "%s · Civantic LLC" },
  description:
    "Civantic partners with government and industry to modernize public health, food safety, and health administration—project delivery, enterprise risk management, and decision support you can measure.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:ring">
          Skip to content
        </a>

        <div className="min-h-dvh flex flex-col">
          <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white/70 dark:bg-black/30 border-b border-black/10">
            <div className="container flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold tracking-tight" aria-label="Civantic LLC home">
                <Image src="/logo.png" alt="Civantic LLC logo" width={28} height={28} priority />
                <span>Civantic LLC</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/services" className="nav-link">Services</Link>
                <Link href="/products" className="nav-link">Products</Link>
                <Link href="/about" className="nav-link">About</Link>
                <Link href="/contact" className="nav-link">Contact</Link>
                <a
                  href="https://outbreakresponse.com"
                  className="nav-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open OutbreakResponse.com in a new tab"
                >
                  OutbreakResponse
                </a>
              </nav>
              <div className="flex items-center gap-2">
                <Link href="/contact" className="btn btn-primary">Book a working session</Link>
              </div>
            </div>
          </header>

          <main id="main" className="flex-1">{children}</main>

          <footer className="border-t border-black/10">
            <div className="container py-10 text-sm text-gray-500">
              <div className="grid gap-6 md:grid-cols-3 items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Civantic LLC logo" width={18} height={18} />
                    <span className="font-semibold text-gray-800">Civantic LLC</span>
                  </div>
                  <div>Cedar Crest, New Mexico</div>
                  <div><a className="hover:underline" href="mailto:info@civantic.com">info@civantic.com</a></div>
                  <div className="text-gray-600">Civantic LLC is a New Mexico single‑member LLC.</div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800">Links</div>
                  <div className="flex flex-col">
                    <Link href="/services" className="hover:underline">Services</Link>
                    <Link href="/products" className="hover:underline">Products</Link>
                    <Link href="/about" className="hover:underline">About</Link>
                    <Link href="/contact" className="hover:underline">Contact</Link>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800">Dashboards</div>
                  <a
                    href="https://outbreakresponse.com"
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OutbreakResponse.com
                  </a>
                </div>
              </div>
              <div className="mt-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <p>© {new Date().getFullYear()} Civantic LLC. All rights reserved.</p>
                <div className="flex gap-4">
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <Link href="/terms" className="hover:underline">Terms</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
