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
  const whereParts = [
    `submission_date >= '${iso(start)}'`,
    `wastewater_percentile IS NOT NULL`,
    state ? `wwtp_jurisdiction='${state==="NM"?"New Mexico":state}'` : (scope==="NM" ? `wwtp_jurisdiction='New Mexico'` : "")
  ].filter(Boolean)
  url.searchParams.set("$select", "submission_date as date, avg(wastewater_percentile) as value")
  url.searchParams.set("$where", whereParts.join(" AND "))
  url.searchParams.set("$group", "submission_date")
  url.searchParams.set("$order", "submission_date")
  url.searchParams.set("$limit", String(months*60))

  const headers: Record<string,string> = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN

  try {
    const r = await fetch(url.toString(), { headers })
    const text = await r.text()
    if (!r.ok) {
      return NextResponse.json({ series: [], error: true, errorDetail: `NWSS ${r.status}: ${text.slice(0,300)}`, fetchedAt: new Date().toISOString() }, { status: 502 })
    }
    const rows = JSON.parse(text) as any[]
    const series: Pt[] = (rows||[]).map(x => ({ date: String(x.date).slice(0,10), value: Number(x.value||0) }))
    return NextResponse.json({ series, fetchedAt: new Date().toISOString() })
  } catch (e:any) {
    return NextResponse.json({ series: [], error: true, errorDetail: String(e?.message||e), fetchedAt: new Date().toISOString() }, { status: 502 })
  }
}
