import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
  const pages = ["", "/sources"]
  return pages.map((p) => ({ url: `${base}${p}`, lastModified: new Date() }))
}
