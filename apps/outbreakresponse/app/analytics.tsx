"use client"
import Script from "next/script"
export default function Analytics() {
  const domain = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/^https?:\/\//, "") || "localhost"
  return <Script defer data-domain={domain} src="https://plausible.io/js/script.js" />
}
