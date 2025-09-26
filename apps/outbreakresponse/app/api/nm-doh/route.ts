export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

export async function GET() {
  try {
    // Prefer env URL if provided
    const url = process.env.NM_DOH_JSON_URL
    if (url && /^https?:\/\//i.test(url)) {
      const r = await fetch(url, { next: { revalidate: 300 } })
      if (r.ok) {
        const j = await r.json()
        const data = Array.isArray(j) ? j : (j.data || [])
        return NextResponse.json({ data })
      }
    }
    // Fall back to public file
    const filePath = path.join(process.cwd(), "apps/outbreakresponse/public/nm-doh.json")
    const txt = await fs.readFile(filePath, "utf-8")
    const j = JSON.parse(txt)
    const data = Array.isArray(j) ? j : (j.data || [])
    return NextResponse.json({ data })
  } catch (e:any) {
    return NextResponse.json({ data: [], error: true, errorDetail: String(e?.message || e) }, { status: 502 })
  }
}
