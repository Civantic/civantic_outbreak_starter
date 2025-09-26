export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"

type Row = {
  id: string
  date: string
  stateScope: string[]
  product: string
  reason: string
  classification?: string
  source: string
}

const STATES: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],
  ["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],
  ["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],["DC","District of Columbia"]
]
const ALL = STATES.map(s => s[0])

function ymd(d: Date){ return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}` }

function parseStates(t: string){
  t = (t || "").toLowerCase()
  if (/nationwide|national/.test(t)) return ALL
  const f = new Set<string>()
  for (const [ab,nm] of STATES){
    if (new RegExp(`\\b${ab.toLowerCase()}\\b`).test(t) || new RegExp(nm.toLowerCase()).test(t)) f.add(ab)
  }
  return Array.from(f)
}

export async function GET(req: Request){
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase()
  const months = Number(u.searchParams.get("months") || "6")
  const cls = (u.searchParams.get("class") || "").toLowerCase().trim()
  const pq  = (u.searchParams.get("product_q") || "").toLowerCase().trim()
  const stateParam = (u.searchParams.get("state") || "").toUpperCase().trim()

  const end = new Date()
  const start = new Date(end); start.setMonth(end.getMonth() - months)

  const qs = new URLSearchParams()
  qs.set("search", `report_date:[${ymd(start)}+TO+${ymd(end)}]`)
  qs.set("limit", "250")
  const key = process.env.OPENFDA_API_KEY
  if (key) qs.set("api_key", key)

  const url = `https://api.fda.gov/food/enforcement.json?${qs.toString()}`

  try{
    const r = await fetch(url, { next: { revalidate: 3600 } })
    if (!r.ok) {
      const txt = await r.text()
      return NextResponse.json({ data: [], error: true, errorDetail: `openFDA ${r.status}: ${txt.slice(0,300)}` }, { status: 502 })
    }
    const j = await r.json() as any
    const items: any[] = Array.isArray(j.results) ? j.results : []

    let rows: Row[] = items.map((x:any) => {
      const states = parseStates(String(x.distribution_pattern || ""))
      const date = x.report_date ? `${x.report_date.slice(0,4)}-${x.report_date.slice(4,6)}-${x.report_date.slice(6,8)}` : ""
      return {
        id: x.recall_number || x.event_id || crypto.randomUUID(),
        date,
        stateScope: states,
        product: x.product_description || "",
        reason: x.reason_for_recall || "",
        classification: (x.classification || "").toString(),
        source: "FDA openFDA"
      }
    })

    if (scope === "NM") rows = rows.filter(r => r.stateScope.includes("NM") || r.stateScope.length === ALL.length)
    if (stateParam) rows = rows.filter(r => r.stateScope.includes(stateParam) || r.stateScope.length === ALL.length)
    if (cls) rows = rows.filter(r => String(r.classification || "").toLowerCase().includes(cls))
    if (pq)  rows = rows.filter(r => String(r.product || "").toLowerCase().includes(pq))

    return NextResponse.json({ data: rows })
  }catch(e:any){
    return NextResponse.json({ data: [], error: true, errorDetail: String(e?.message || e) }, { status: 502 })
  }
}
