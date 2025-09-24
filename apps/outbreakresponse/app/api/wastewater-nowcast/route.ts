import { NextResponse } from "next/server"

type Pt = { date: string; value: number }
type In = { scope?: "US"|"NM"; state?: string; months?: number }

function addDays(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate()+days); return x }
function ymd(d: Date) { return d.toISOString().slice(0,10) }

export async function GET(req: Request) {
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase() as "US"|"NM"
  const state = (u.searchParams.get("state") || "").toUpperCase()
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months") || 6)))

  // Use your own wastewater API (same logic/tokens), so we’re resilient
  const base = new URL(req.url).origin
  const q = new URLSearchParams()
  if (state) q.set("state", state); else q.set("scope", scope)
  q.set("months", String(months))

  try {
    const j = await fetch(`${base}/api/wastewater?${q.toString()}`, { cache: "no-store" }).then(r=>r.json())
    const series: Pt[] = (j.series||[]).map((p:any)=>({ date:p.date, value:Number(p.value||0) }))
    if (series.length < 8) return NextResponse.json({ series, forecast: [] })

    // simple, explainable forecast: linear regression over last N points
    const N = Math.min(28, series.length)
    const last = series.slice(-N)
    const xs = last.map((_,i)=>i) // 0..N-1
    const ys = last.map(p=>p.value)

    const meanX = xs.reduce((a,b)=>a+b,0)/xs.length
    const meanY = ys.reduce((a,b)=>a+b,0)/ys.length
    const num = xs.reduce((acc, x, i)=> acc + (x-meanX)*(ys[i]-meanY), 0)
    const den = xs.reduce((acc, x)=> acc + (x-meanX)*(x-meanX), 0) || 1
    const slope = num/den
    const intercept = meanY - slope*meanX

    const lastDate = new Date(series.slice(-1)[0].date)
    const horizon = 8 // 8 future points ~ 8 days (NWSS is daily aggregates)
    const forecast = Array.from({length:horizon}, (_,k)=>({
      date: ymd(addDays(lastDate, k+1)),
      value: Math.max(0, Math.round(intercept + slope*(N + k)))
    }))

    return NextResponse.json({ series, forecast })
  } catch {
    return NextResponse.json({ series: [], forecast: [] }, { status: 200 })
  }
}
