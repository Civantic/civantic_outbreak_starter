// apps/outbreakresponse/app/api/nm-doh/route.ts
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

type Event = { date?: string; title?: string; link?: string }
type Row = { date: string; cases?: number; hospitalizations?: number; deaths?: number; link?: string; title?: string }

function safeNum(x: any) {
  const n = Number(x)
  return isFinite(n) ? n : undefined
}

function parseCSV(txt: string): Row[] {
  const lines = txt.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const head = lines[0].split(",").map((s) => s.trim().toLowerCase())
  const rows: Row[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",")
    const rec: any = {}
    head.forEach((h, idx) => {
      rec[h] = (cols[idx] || "").trim()
    })
    const date = String(rec["date"] || "").slice(0, 10)
    if (!date) continue
    rows.push({
      date,
      cases: safeNum(rec["cases"]),
      hospitalizations: safeNum(rec["hospitalizations"]),
      deaths: safeNum(rec["deaths"]),
      link: rec["link"] || undefined,
      title: rec["title"] || undefined,
    })
  }
  return rows
}

export async function GET() {
  try {
    // 1) Optional JSON with curated events (backward compatible)
    const pub = path.join(process.cwd(), "public")
    const jsonPath = path.join(pub, "nm-doh.json")
    let curated: Event[] = []
    try {
      const buf = await fs.readFile(jsonPath, "utf8")
      const j = JSON.parse(buf)
      curated = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
    } catch {
      // ignore if not present
    }

    // 2) Merge any CSVs under public/nm-doh/
    const dir = path.join(pub, "nm-doh")
    let series: Row[] = []
    try {
      const files = await fs.readdir(dir)
      for (const f of files) {
        if (!f.toLowerCase().endsWith(".csv")) continue
        const txt = await fs.readFile(path.join(dir, f), "utf8")
        const rows = parseCSV(txt)
        series = series.concat(rows)
      }
    } catch {
      // directory may not exist yet
    }

    // Aggregate by date
    const byDate = new Map<string, Row>()
    for (const r of series) {
      const prev = byDate.get(r.date) || { date: r.date, cases: 0, hospitalizations: 0, deaths: 0 }
      byDate.set(r.date, {
        date: r.date,
        cases: (prev.cases || 0) + (r.cases || 0),
        hospitalizations: (prev.hospitalizations || 0) + (r.hospitalizations || 0),
        deaths: (prev.deaths || 0) + (r.deaths || 0),
      })
    }
    const timeseries = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(
      { events: curated, timeseries },
      { headers: { "Cache-Control": "public, s-maxage=1800, max-age=600, stale-while-revalidate=86400" } }
    )
  } catch (e: any) {
    return NextResponse.json(
      { events: [], timeseries: [], error: true, message: String(e?.message || e) },
      { status: 200, headers: { "Cache-Control": "public, max-age=120" } }
    )
  }
}
