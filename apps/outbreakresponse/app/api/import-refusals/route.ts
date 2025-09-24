import { NextResponse } from "next/server"

type Row = { id:string; date:string; product:string; country?:string; reason?:string; source:"FDA-OASIS" }

export async function GET(req: Request) {
  const u = new URL(req.url)
  const months = Number(u.searchParams.get("months") || 6)
  try {
    const url = process.env.FDA_IMPORT_REFUSALS_URL || ""  // monthly CSV/JSON endpoint (set in .env.local)
    if (!url) throw new Error("no oasis url")
    const r = await fetch(url, { next: { revalidate: 86400 } })
    if (!r.ok) throw new Error(String(r.status))
    const txt = await r.text()
    const lines = txt.split(/\r?\n/).slice(1).filter(Boolean)  // naive CSV; replace with robust parser later
    const now = new Date(); const start = new Date(now); start.setMonth(now.getMonth() - months)
    const rows: Row[] = lines.map((line) => {
      const [dt, prod, ctry, rsn] = (line.split(",") as string[]).map(s=>s?.trim() || "")
      const date = dt?.slice(0,10) || ""
      return { id: `${date}-${prod}-${ctry}`.slice(0,80), date, product: prod, country: ctry, reason: rsn, source: "FDA-OASIS" }
    }).filter(r => r.date && new Date(r.date) >= start)
    return NextResponse.json({ data: rows })
  } catch {
    return NextResponse.json({ data: [], fallback: true })
  }
}
