export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

type Ev = { id:string; date:string; products:string[]; reactions:string[]; state?:string; reporter?:string; source:string }

const FDA_CAERS = "https://api.fda.gov/food/event.json"
const yyyymmdd = (d: Date) => d.toISOString().slice(0,10).replace(/-/g,"")
const iso = (d: string|number) => {
  const s = String(d||"")
  if (s.length === 8) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return ""
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase()
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months") || 6)))

  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1); start.setMonth(start.getMonth() - months + 1)

  const params = new URLSearchParams()
  // Robust date range for CAERS
  params.set("search", `date_started:[${yyyymmdd(start)}+TO+${yyyymmdd(end)}]`)
  params.set("limit", "100")
  if (process.env.OPENFDA_API_KEY) params.set("api_key", process.env.OPENFDA_API_KEY)

  const url = `${FDA_CAERS}?${params.toString()}`

  try {
    const r = await fetch(url, { next: { revalidate: 300 } })
    const txt = await r.text()
    if (!r.ok) {
      const res = NextResponse.json(
        { data: [], error: true, errorDetail: `CAERS ${r.status}: ${txt.slice(0,300)}`, fetchedAt: new Date().toISOString() },
        { status: 502 }
      )
      res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
      return res
    }

    const json = JSON.parse(txt)
    const results: any[] = Array.isArray(json?.results) ? json.results : []

    const mapped: Ev[] = results.map((e:any, i:number) => {
      const date = iso(e.date_started || e.date_created || e.event_date || "")
      const products = Array.isArray(e.products) ? e.products.map((p:any)=> p?.name_brand || p?.name || "").filter(Boolean).slice(0,3) : []
      const reactions = Array.isArray(e.reactions) ? e.reactions.map((r:any)=> r?.reaction || r?.term || "").filter(Boolean).slice(0,3) : []
      const state = String(e?.consumer?.state || "").toUpperCase() || undefined
      const reporter = e?.reporter_occupation ? String(e.reporter_occupation) : undefined
      return { id: `caers-${e.report_id || e.event_id || i}`, date, products, reactions, state, reporter, source: "FDA CAERS" }
    }).filter(x => x.date)

    const data = scope === "NM" ? mapped.filter(m => m.state === "NM") : mapped

    const res = NextResponse.json({ data, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control","s-maxage=300, stale-while-revalidate=600")
    return res
  } catch (e:any) {
    const res = NextResponse.json(
      { data: [], error: true, errorDetail: String(e?.message || e), fetchedAt: new Date().toISOString() },
      { status: 502 }
    )
    res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
    return res
  }
}
