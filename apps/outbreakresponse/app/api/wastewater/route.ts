export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

type Pt={date:string,value:number}
function iso(d:Date){ return d.toISOString().slice(0,10) }

export async function GET(req:Request){
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope")||"US").toUpperCase()
  const state = (u.searchParams.get("state")||"").toUpperCase()
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months")||6)))

  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1); start.setMonth(start.getMonth() - months + 1)

  const base = process.env.NWSS_API_URL || "https://data.cdc.gov/resource/2ew6-ywp6.json"
  const url = new URL(base)
  // many tables expose 'date', not 'submission_date'
  const whereParts = [
    `date >= '${iso(start)}'`,
    `wastewater_percentile IS NOT NULL`,
    state ? `wwtp_jurisdiction='${state==="NM"?"New Mexico":state}'` : (scope==="NM" ? `wwtp_jurisdiction='New Mexico'` : "")
  ].filter(Boolean)

  url.searchParams.set("$select", "date, avg(wastewater_percentile) as value")
  url.searchParams.set("$where", whereParts.join(" AND "))
  url.searchParams.set("$group", "date")
  url.searchParams.set("$order", "date")
  url.searchParams.set("$limit", String(months*60))

  const headers: Record<string,string> = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN

  try {
    const r = await fetch(url.toString(), { headers, next: { revalidate: 300 } })
    const text = await r.text()
    if (!r.ok) {
      const res = NextResponse.json({ series: [], error: true, errorDetail: `NWSS ${r.status}: ${text.slice(0,300)}`, fetchedAt: new Date().toISOString() }, { status: 502 })
      res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
      return res
    }
    const rows = JSON.parse(text) as any[]
    const series: Pt[] = (rows||[]).map(x => ({ date: String(x.date).slice(0,10), value: Number(x.value||0) }))
    const res = NextResponse.json({ series, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control","s-maxage=300, stale-while-revalidate=600")
    return res
  } catch (e:any) {
    const res = NextResponse.json({ series: [], error: true, errorDetail: String(e?.message||e), fetchedAt: new Date().toISOString() }, { status: 502 })
    res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
    return res
  }
}
