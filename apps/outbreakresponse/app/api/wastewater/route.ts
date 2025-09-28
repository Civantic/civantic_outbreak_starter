// apps/outbreakresponse/app/api/wastewater/route.ts
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

type Pt = { date: string; value: number; detected?: boolean }

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const monthsRaw = parseInt(url.searchParams.get("months") || "6", 10)
  const state = (url.searchParams.get("state") || "").toUpperCase()
  const months = clamp(isFinite(monthsRaw) ? monthsRaw : 6, 1, 12)

  const NWSS = process.env.NWSS_API_URL
  if (!NWSS) {
    return NextResponse.json(
      { series: [], error: true, message: "NWSS_API_URL not set", fallback: true },
      { status: 200, headers: { "Cache-Control": "public, max-age=120" } }
    )
  }

  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceISO = toISO(since)

  // Build several candidate Socrata queries (different date/state fields); fall back to raw.
  const candidates: string[] = []
  function addCandidate(dateField: string, stateField?: string) {
    let where = `${dateField} >= "${sinceISO}"`
    if (state && stateField) where += ` AND upper(${stateField}) = "${state}"`
    const select = `${dateField} as date, wastewater_percentile, percent_detection_15d, detectable`
    const u =
      `${NWSS}?` +
      `$select=${encodeURIComponent(select)}` +
      `&$where=${encodeURIComponent(where)}` +
      `&$order=${encodeURIComponent(dateField + " ASC")}` +
      `&$limit=50000`
    candidates.push(u)
  }
  addCandidate("date", "state")
  addCandidate("submission_date", "state")
  addCandidate("date", "state_abbreviation")
  addCandidate("submission_date", "state_abbreviation")
  candidates.push(NWSS) // last resort: raw fetch, we’ll normalize client-side

  let rows: any[] = []
  let lastErr: string | null = null
  const headers: HeadersInit = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN as string

  for (const u of candidates) {
    try {
      const r = await fetch(u, {
        headers,
        // cache on the server for speed but keep it fresh
        next: { revalidate: 1800 },
      })
      if (!r.ok) {
        lastErr = `${r.status} ${await r.text().catch(() => r.statusText)}`
        continue
      }
      const data = await r.json()
      if (Array.isArray(data)) {
        rows = data
        break
      }
    } catch (e: any) {
      lastErr = String(e?.message || e)
    }
  }

  if (!rows.length) {
    return NextResponse.json(
      { series: [], fallback: true, error: true, detail: lastErr || "no data" },
      { status: 200, headers: { "Cache-Control": "public, max-age=120" } }
    )
  }

  // Normalize
  const series: Pt[] = rows
    .map((r: any) => {
      const d = r.date || r.submission_date || r.sample_date || r.week_start || r.week || r.Day || r.day
      const rawVal = r.wastewater_percentile ?? r.percentile ?? r.value ?? r.wastewater_percentile_7d ?? r.median
      const v = Number(rawVal)
      const val = isFinite(v) ? v : 0
      const det =
        typeof r.detectable !== "undefined"
          ? String(r.detectable).toLowerCase() === "true"
          : val > 0
      const date = String(d || "").slice(0, 10)
      return date ? { date, value: val, detected: det } : null
    })
    .filter(Boolean) as Pt[]

  series.sort((a, b) => a.date.localeCompare(b.date))

  const last14 = series.slice(-14)
  const detectionRate14d =
    last14.length > 0 ? Math.round((last14.filter((p) => p.detected).length / last14.length) * 100) : 0
  const latest = series.slice(-1)[0]?.value ?? 0

  return NextResponse.json(
    {
      series,
      latest,
      detectionRate14d,
      fallback: false,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, max-age=600, stale-while-revalidate=86400",
      },
    }
  )
}
