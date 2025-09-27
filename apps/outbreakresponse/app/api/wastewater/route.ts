export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

const NWSS_URL = process.env.NWSS_API_URL || "https://data.cdc.gov/resource/2ew6-ywp6.json"
const iso = (d: Date) => d.toISOString().slice(0, 10)
const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

export async function GET(req: Request) {
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase()
  const stateQ = (u.searchParams.get("state") || "").toUpperCase()
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months") || 6)))

  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  start.setMonth(start.getMonth() - months + 1)

  const url = new URL(NWSS_URL)
  // No brittle selects; fetch and infer columns. Keep page size reasonable but enough for window.
  url.searchParams.set("$limit", String(months * 4000)) // cached; tune if needed

  const headers: Record<string, string> = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN

  try {
    const r = await fetch(url.toString(), { headers, next: { revalidate: 300 } })
    const txt = await r.text()
    if (!r.ok) {
      const res = NextResponse.json(
        { series: [], error: true, errorDetail: `NWSS ${r.status}: ${txt.slice(0, 300)}`, fetchedAt: new Date().toISOString() },
        { status: 502 }
      )
      res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=120")
      return res
    }

    const rows = (JSON.parse(txt) as any[]) || []
    if (rows.length === 0) {
      const res = NextResponse.json({ series: [], fetchedAt: new Date().toISOString() })
      res.headers.set("Cache-Control", "s-maxage=180, stale-while-revalidate=300")
      return res
    }

    const keys = Object.keys(rows[0] || {})
    const pick = (cands: string[], rx?: RegExp) =>
      cands.find((k) => keys.includes(k)) || keys.find((k) => (rx ? rx.test(k) : false)) || ""

    const DATE = pick(
      ["date", "submission_date", "sample_date", "collection_date", "week_end", "week_end_date", "report_date"],
      /(date|week)/i
    )
    const STATE = pick(["wwtp_jurisdiction", "state", "state_name", "jurisdiction"], /(state|juris)/i)
    const VAL = pick(["wastewater_percentile", "percentile", "ww_percentile"], /(percent)/i)

    // group by date; optionally filter to NM
    const byDay = new Map<string, number[]>()
    const wantNM = scope === "NM" || stateQ === "NM"
    for (const row of rows) {
      const rawDate = DATE ? row[DATE] : undefined
      const d = rawDate ? new Date(rawDate) : undefined
      if (!d || isNaN(+d)) continue
      if (d < start || d > end) continue

      if (wantNM) {
        const sVal = String(row[STATE] || "").toUpperCase()
        // accept either "NM" or "NEW MEXICO"
        if (!(sVal === "NM" || sVal.includes("NEW MEXICO"))) continue
      }

      const v = Number(row[VAL])
      if (!Number.isFinite(v)) continue

      const day = iso(d)
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(v)
    }

    const series = Array.from(byDay.entries())
      .map(([date, arr]) => ({ date, value: avg(arr) }))
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))

    const res = NextResponse.json({ series, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
    return res
  } catch (e: any) {
    const res = NextResponse.json(
      { series: [], error: true, errorDetail: String(e?.message || e), fetchedAt: new Date().toISOString() },
      { status: 502 }
    )
    res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=120")
    return res
  }
}
