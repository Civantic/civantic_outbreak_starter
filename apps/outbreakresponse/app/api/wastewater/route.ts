// apps/outbreakresponse/app/api/wastewater/route.ts
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

type Pt = { date: string; value: number; n?: number }

function iso(d: Date) { return d.toISOString().slice(0,10) }

function sampleSeries(months: number): Pt[] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setMonth(start.getMonth() - months)
  const pts: Pt[] = []
  for (let i = 0; i < months * 8; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i * 4)
    // simple wave 25..85
    const v = 55 + Math.round(30 * Math.sin(i / 3))
    pts.push({ date: iso(d), value: Math.max(0, Math.min(100, v)), n: 3 + (i % 4) })
  }
  return pts
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const months = Math.max(1, Math.min(12, Number(searchParams.get("months") || "6")))
  const state = (searchParams.get("state") || "US").toUpperCase()

  const NWSS_URL = process.env.NWSS_API_URL || "" // e.g. https://data.cdc.gov/resource/<id>.json
  const APP_TOKEN = process.env.CDC_APP_TOKEN || ""

  const start = new Date()
  start.setMonth(start.getMonth() - months)
  start.setDate(1)

  async function tryNWSS(): Promise<Pt[] | null> {
    if (!NWSS_URL) return null

    // Try a few popular field names for the date dimension.
    const candidates = [
      // date grouped
      `$select=date,avg(wastewater_percentile) as value,count(wastewater_percentile) as n&$where=date >= '${iso(start)}' AND wastewater_percentile IS NOT NULL${
        state !== "US" ? ` AND state='${state}'` : ""
      }&$group=date&$order=date ASC&$limit=5000`,
      // collection_date grouped
      `$select=collection_date as date,avg(wastewater_percentile) as value,count(wastewater_percentile) as n&$where=collection_date >= '${iso(start)}' AND wastewater_percentile IS NOT NULL${
        state !== "US" ? ` AND state='${state}'` : ""
      }&$group=collection_date&$order=collection_date ASC&$limit=5000`,
      // submission_date grouped
      `$select=submission_date as date,avg(wastewater_percentile) as value,count(wastewater_percentile) as n&$where=submission_date >= '${iso(start)}' AND wastewater_percentile IS NOT NULL${
        state !== "US" ? ` AND state='${state}'` : ""
      }&$group=submission_date&$order=submission_date ASC&$limit=5000`
    ]

    for (const q of candidates) {
      try {
        const url = `${NWSS_URL}?${q}`
        const resp = await fetch(url, {
          headers: APP_TOKEN ? { "X-App-Token": APP_TOKEN } : undefined,
          next: { revalidate: 300 }
        })
        if (!resp.ok) continue
        const rows = (await resp.json()) as any[]
        if (!Array.isArray(rows)) continue
        return rows
          .map((r: any) => ({
            date: r.date || r.collection_date || r.submission_date,
            value: Number(r.value || 0),
            n: Number(r.n || 0)
          }))
          .filter((p: Pt) => !!p.date)
      } catch {
        // try next
      }
    }
    return null
  }

  let series = await tryNWSS()
  let fallback = false
  if (series === null || series.length === 0) {
    fallback = true
    series = sampleSeries(months)
  }

  return NextResponse.json(
    { series, fallback },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=86400" } }
  )
}
