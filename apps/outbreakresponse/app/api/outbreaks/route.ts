export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

const CDC = "https://data.cdc.gov/resource/5xkq-dg7x.json"

function asNum(x:any){ const n = Number(x); return Number.isFinite(n) ? n : 0 }
function monthDate(year:number, month:number){
  return new Date(Date.UTC(year, Math.max(0, month-1), 1)).toISOString().slice(0,10)
}
function mapRow(r:any, i:number){
  const y = asNum(r.year) || new Date().getFullYear()
  const m = asNum(r.month) || 1
  const state = String(r.state || "").toUpperCase()
  return {
    id: r.outbreak_id || r.incident_id || `nors-${i}`,
    date: monthDate(y, m),
    state,
    etiology: r.etiology || "Unknown",
    illnesses: asNum(r.illnesses || r.number_ill),
    hospitalizations: asNum(r.hospitalizations || r.number_hospitalized),
    deaths: asNum(r.deaths),
    source: "CDC NORS"
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase()
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months") || 6)))
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  start.setMonth(start.getMonth() - months + 1)

  const url = new URL(CDC)
  // Select only columns that actually exist on the dataset
  url.searchParams.set("$select", "year,month,state,etiology,illnesses,hospitalizations,deaths,incident_id,outbreak_id")
  url.searchParams.set("$where", `year >= ${start.getFullYear()}`)
  url.searchParams.set("$limit", "5000")

  const headers: Record<string,string> = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN

  try {
    const r = await fetch(url.toString(), { headers, next: { revalidate: 300 } })
    const text = await r.text()
    if (!r.ok) {
      const res = NextResponse.json({ data: [], error: true, errorDetail: `CDC ${r.status}: ${text.slice(0,300)}`, fetchedAt: new Date().toISOString() }, { status: 502 })
      res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
      return res
    }
    const rows = JSON.parse(text) as any[]
    let data = rows.map(mapRow)
    if (scope === "NM") data = data.filter(d => d.state === "NM")
    const res = NextResponse.json({ data, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control","s-maxage=300, stale-while-revalidate=600")
    return res
  } catch (e:any) {
    const res = NextResponse.json({ data: [], error: true, errorDetail: String(e?.message || e), fetchedAt: new Date().toISOString() }, { status: 502 })
    res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
    return res
  }
}
