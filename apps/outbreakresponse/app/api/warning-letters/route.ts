import { NextResponse } from "next/server"

type Row = { id:string; date:string; firm:string; subject:string; url:string; source:"FDA-WL" }

export async function GET() {
  try {
    const url = process.env.FDA_WARNING_LETTERS_URL || ""  // set to a JSON/CSV feed you trust
    if (!url) throw new Error("no wl url")
    const r = await fetch(url, { next: { revalidate: 86400 } })
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    const rows: Row[] = (Array.isArray(j) ? j : (j.items||j.results||[])).map((x:any)=>({
      id: x.id || crypto.randomUUID(),
      date: x.date || x.posted || "",
      firm: x.firm || x.company || "",
      subject: x.subject || x.title || "",
      url: x.url || x.link || "",
      source: "FDA-WL"
    }))
    return NextResponse.json({ data: rows })
  } catch {
    return NextResponse.json({ data: [], fallback: true })
  }
}
