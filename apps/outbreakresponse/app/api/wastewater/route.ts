import { NextResponse } from "next/server"

type Point = { date: string; value: number; n: number }

const STATE_NAMES: Record<string,string> = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DE:"Delaware",
  FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky",
  LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri",
  MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York",
  NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island",
  SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia",
  WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming", DC:"District of Columbia"
}

function iso(d: Date) { return d.toISOString().slice(0,10) }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scope = (searchParams.get("scope") || "").toUpperCase()
  const stateAbbr = (searchParams.get("state") || "").toUpperCase()
  const monthsBack = Math.max(1, Math.min(18, Number(searchParams.get("months") || 6)))

  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  start.setMonth(start.getMonth() - monthsBack + 1)

  const base = process.env.NWSS_API_URL || "https://data.cdc.gov/resource/2ew6-ywp6.json"
  const url = new URL(base)

  const whereParts = [`submission_date >= '${iso(start)}'`, `wastewater_percentile IS NOT NULL`]
  if (stateAbbr && STATE_NAMES[stateAbbr]) whereParts.push(`wwtp_jurisdiction='${STATE_NAMES[stateAbbr]}'`)
  else if (scope === "NM") whereParts.push(`wwtp_jurisdiction='New Mexico'`)

  url.searchParams.set("$select", "submission_date as date, avg(wastewater_percentile) as value, count(wastewater_percentile) as n")
  url.searchParams.set("$where", whereParts.join(" AND "))
  url.searchParams.set("$group", "submission_date")
  url.searchParams.set("$order", "submission_date")
  url.searchParams.set("$limit", String(monthsBack * 60))

  const headers: Record<string,string> = {}
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN as string

  try {
    const r = await fetch(url.toString(), { headers, next: { revalidate: 3600 } })
    if (!r.ok) throw new Error(String(r.status))
    const raw = await r.json() as any[]
    const series: Point[] = (raw || []).map(x => ({
      date: String(x.date).slice(0,10),
      value: Number(x.value || 0),
      n: Number(x.n || 0)
    })).sort((a,b)=>+new Date(a.date)-+new Date(b.date))

    const latest = series.slice(-1)[0]?.value ?? 0
    const last7 = series.slice(-7).reduce((a,b)=>a+(b.value||0),0) / Math.max(1, series.slice(-7).length)
    const prev7 = series.slice(-14,-7).reduce((a,b)=>a+(b.value||0),0) / Math.max(1, series.slice(-14,-7).length)
    const changePct = prev7 ? ((last7 - prev7) / prev7) * 100 : 0
    const samples = series.reduce((a,b)=>a+(b.n||0),0)

    return NextResponse.json({
      series,
      latest: Math.round(latest),
      changePct,
      samples,
      fetchedAt: new Date().toISOString()
    })
  } catch {
    const pts: Point[] = []
    for (let i = monthsBack*4; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth(), 1); d.setDate(d.getDate()-i*7)
      const v = 40 + Math.round(20*Math.sin(i/2)) + Math.round(10*Math.random())
      pts.push({ date: iso(d), value: Math.max(0,v), n: 5 })
    }
    const latest = pts.slice(-1)[0]?.value ?? 0
    const last7 = pts.slice(-7).reduce((a,b)=>a+(b.value||0),0) / Math.max(1, pts.slice(-7).length)
    const prev7 = pts.slice(-14,-7).reduce((a,b)=>a+(b.value||0),0) / Math.max(1, pts.slice(-14,-7).length)
    const changePct = prev7 ? ((last7 - prev7) / prev7) * 100 : 0
    const samples = pts.reduce((a,b)=>a+(b.n||0),0)
    return NextResponse.json({ series: pts, latest, changePct, samples, fallback: true, fetchedAt: new Date().toISOString() })
  }
}
