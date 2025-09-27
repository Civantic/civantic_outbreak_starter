export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

const CDC_URL = "https://data.cdc.gov/resource/5xkq-dg7x.json"

// helpers
const num = (x: any) => {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
const isoDay = (d: Date) => d.toISOString().slice(0, 10)

function monthToISO(year?: any, month?: any, fallback?: string) {
  const y = num(year)
  const m = num(month)
  if (y && m) return isoDay(new Date(Date.UTC(y, Math.max(0, m - 1), 1)))
  if (fallback) {
    const d = new Date(fallback)
    if (!isNaN(+d)) return isoDay(d)
  }
  return ""
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase()
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months") || 6)))

  // time window
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  start.setMonth(start.getMonth() - months + 1)

  // Build a tolerant fetch: no $select, no fragile $where — filter in code
  const url = new URL(CDC_URL)
  url.searchParams.set("$limit", "50000") // cached, so ok

  const headers: Record<string, string> = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN

  try {
    const r = await fetch(url.toString(), { headers, next: { revalidate: 300 } })
    const txt = await r.text()
    if (!r.ok) {
      const res = NextResponse.json(
        { data: [], error: true, errorDetail: `CDC ${r.status}: ${txt.slice(0, 300)}`, fetchedAt: new Date().toISOString() },
        { status: 502 }
      )
      res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=120")
      return res
    }

    const rows = (JSON.parse(txt) as any[]) || []
    if (rows.length === 0) {
      const res = NextResponse.json({ data: [], fetchedAt: new Date().toISOString() })
      res.headers.set("Cache-Control", "s-maxage=180, stale-while-revalidate=300")
      return res
    }

    // Column autodetect
    const keys = Object.keys(rows[0] || {})
    const k = (names: string[], alt?: RegExp) =>
      names.find((n) => keys.includes(n)) || keys.find((x) => (alt ? alt.test(x) : false)) || ""

    const YEAR = k(["year", "report_year", "mmwr_year"], /year/i)
    const MONTH = k(["month", "report_month", "mmwr_month"], /month/i)
    const DATE = k(["date", "report_date", "event_date", "mmwr_week_end", "mmwr_week_end_date"], /(date|week)/i)
    const STATE = k(["state", "reporting_state", "residence_state"], /state/i)
    const ETIO = k(["etiology", "etiologic_agent", "pathogen"], /(etiol|pathog)/i)
    const ILL = k(["illnesses", "number_ill", "n_ill", "cases"], /(ill|case)/i)
    const HOSP = k(["hospitalizations", "number_hospitalized", "n_hospitalized"], /(hosp)/i)
    const DEATH = k(["deaths", "number_deaths", "n_deaths"], /(death)/i)

    const mapped = rows
      .map((x, i) => {
        const date = monthToISO(x[YEAR], x[MONTH], x[DATE])
        if (!date) return null
        const state = String(x[STATE] || "").toUpperCase()
        return {
          id: `nors-${date}-${state || "NA"}-${i}`,
          date,
          state,
          etiology: x[ETIO] || "Unknown",
          illnesses: num(x[ILL]),
          hospitalizations: num(x[HOSP]),
          deaths: num(x[DEATH]),
          source: "CDC NORS",
        }
      })
      .filter(Boolean) as {
      id: string
      date: string
      state: string
      etiology: string
      illnesses: number
      hospitalizations: number
      deaths: number
      source: string
    }[]

    let data = mapped.filter((m) => new Date(m.date) >= start && new Date(m.date) <= end)
    if (scope === "NM") data = data.filter((d) => d.state === "NM")

    const res = NextResponse.json({ data, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
    return res
  } catch (e: any) {
    const res = NextResponse.json(
      { data: [], error: true, errorDetail: String(e?.message || e), fetchedAt: new Date().toISOString() },
      { status: 502 }
    )
    res.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate=120")
    return res
  }
}
