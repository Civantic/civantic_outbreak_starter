import { NextResponse } from "next/server"

type EventRow = {
  id: string
  date: string
  products: string[]
  reactions: string[]
  reporter?: string
  source: "openFDA-CAERS"
}

function ymd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const months = Math.max(1, Math.min(12, Number(u.searchParams.get("months") || 6)))
  const productQ = (u.searchParams.get("product_q") || "").trim()
  const limit = Math.max(1, Math.min(250, Number(u.searchParams.get("limit") || 200)))

  const end = new Date()
  const start = new Date(end)
  start.setMonth(end.getMonth() - months)

  // Build a single openFDA `search` string with OR across date fields.
  const parts: string[] = []
  const dateRange = `[${ymd(start)}+TO+${ymd(end)}]`
  parts.push(`(date_created:${dateRange}+OR+date_started:${dateRange})`)

  if (productQ) {
    const q = encodeURIComponent(productQ)
    // try multiple product fields
    parts.push(
      `(${[
        `products.name_brand:"${q}"`,
        `products.name:"${q}"`,
        `products.industry_name:"${q}"`,
        `products.industry_code:"${q}"`
      ].join("+OR+")})`
    )
  }

  const search = parts.join("+AND+")
  const qs = new URLSearchParams()
  qs.set("search", search)
  qs.set("limit", String(limit))
  const key = process.env.OPENFDA_API_KEY
  if (key) qs.set("api_key", key)

  const url = `https://api.fda.gov/food/event.json?${qs.toString()}`

  try {
    const r = await fetch(url, { next: { revalidate: 1800 } })
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json() as any
    const items: any[] = Array.isArray(j?.results) ? j.results : []

    let rows: EventRow[] = items.map((ev: any) => {
      const id = String(ev.report_number || ev.recall_number || crypto.randomUUID())
      const dateRaw = String(ev.date_created || ev.date_started || ev.event_date || "")
      const date = dateRaw.length === 8 ? `${dateRaw.slice(0,4)}-${dateRaw.slice(4,6)}-${dateRaw.slice(6,8)}` : dateRaw.slice(0,10)
      const prods = Array.isArray(ev.products)
        ? ev.products.map((p: any) => p?.brand_name || p?.name_brand || p?.name || p?.industry_name || "").filter(Boolean)
        : []
      const reacts = Array.isArray(ev.reactions) ? ev.reactions.map((rr: any) => String(rr || "")) : []
      const reporter = ev.reporter_occupation || ev.occupation || undefined
      return { id, date, products: prods, reactions: reacts, reporter, source: "openFDA-CAERS" }
    })

    if (rows.length === 0) {
      const demo: EventRow[] = [
        { id: "demo1", date: "2025-07-30", products: ["Soft cheese"], reactions: ["GI upset", "Fever"], reporter: "Consumer", source: "openFDA-CAERS" },
        { id: "demo2", date: "2025-07-18", products: ["Frozen berries"], reactions: ["Nausea"], reporter: "Healthcare professional", source: "openFDA-CAERS" }
      ]
      return NextResponse.json({ data: demo, fallback: true, fetchedAt: new Date().toISOString() })
    }

    return NextResponse.json({ data: rows, fetchedAt: new Date().toISOString() })
  } catch {
    const demo: EventRow[] = [
      { id: "demo1", date: "2025-07-30", products: ["Soft cheese"], reactions: ["GI upset", "Fever"], reporter: "Consumer", source: "openFDA-CAERS" },
      { id: "demo2", date: "2025-07-18", products: ["Frozen berries"], reactions: ["Nausea"], reporter: "Healthcare professional", source: "openFDA-CAERS" }
    ]
    return NextResponse.json({ data: demo, fallback: true, fetchedAt: new Date().toISOString() })
  }
}
