import { NextResponse } from "next/server"

type Row = { id:string; date:string; product:string; summary:string; states:string[]; source:"FSIS-PHA" }

export async function GET(req: Request) {
  try {
    const url = process.env.FSIS_PHA_URL || ""  // set this in .env.local when you have it
    if (!url) throw new Error("no fsis pha url")
    const r = await fetch(url, { next: { revalidate: 3600 } })
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    const data: Row[] = (Array.isArray(j) ? j : (j.items||j.results||[])).map((x:any) => ({
      id: x.id || x.recall_number || crypto.randomUUID(),
      date: x.date || x.recall_initiation_date || "",
      product: String(x.product_description || x.product || ""),
      summary: String(x.summary || x.reason || ""),
      states: (x.states || x.state_scope || []).map((s:string)=>String(s).toUpperCase()),
      source: "FSIS-PHA"
    }))
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ data: [], fallback: true })
  }
}
