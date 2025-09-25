import { NextResponse } from "next/server"

type Row = { id:string; date:string; stateScope:string[]; product:string; summary:string; source:string }

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

function toISO(s:any){
  s = String(s||"").trim()
  if (!s) return ""
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`
  const m2 = s.match(/^(\d{8})$/)
  if (m2) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
  const d = new Date(s)
  return isNaN(+d) ? "" : d.toISOString().slice(0,10)
}

function parseStates(val:any){
  if (Array.isArray(val)) {
    const out = new Set<string>()
    for (const v of val) {
      const t = String(v||"").toLowerCase()
      const ab = STATES.find(s => s[0].toLowerCase() === t)
      const nm = STATES.find(s => s[1].toLowerCase() === t)
      if (ab) out.add(ab[0]); else if (nm) out.add(nm[0])
    }
    return Array.from(out)
  }
  const t = String(val||"").toLowerCase()
  if (/nationwide|national/.test(t)) return ALL
  const out = new Set<string>()
  for (const [ab,nm] of STATES){
    if (new RegExp(`\\b${ab.toLowerCase()}\\b`).test(t) || new RegExp(nm.toLowerCase()).test(t)) out.add(ab)
  }
  return Array.from(out)
}

export async function GET(){
  try{
    const base = process.env.FSIS_API_URL || "https://www.fsis.usda.gov/fsis/api/recall/v/1"
    const r = await fetch(base, { next: { revalidate: 3600 } })
    if (!r.ok) {
      const txt = await r.text()
      return NextResponse.json({ data: [], error: true, errorDetail: `FSIS ${r.status}: ${txt.slice(0,300)}` }, { status: 502 })
    }
    const raw = await r.json() as any
    const list: any[] = Array.isArray(raw) ? raw : (raw.items || raw.results || [])

    // heuristic: keep items that look like Public Health Alerts
    const alerts = list.filter((x:any) => {
      const tag = String(x.phasetxt || x.alert_type || x.type || "").toLowerCase()
      const title = String(x.title || x.summary || "").toLowerCase()
      return tag.includes("public health alert") || title.includes("public health alert")
    })

    const rows: Row[] = alerts.map((x:any) => ({
      id: x.recall_number || x.id || x.recall_id || x.event_id || crypto.randomUUID(),
      date: toISO(x.recall_initiation_date || x.recall_date || x.start_date || x.date),
      stateScope: parseStates(x.states || x.state || x.states_affected || x.state_distribution || x.distribution || x.distribution_pattern),
      product: String(x.product_description || x.product || x.product_name || ""),
      summary: String(x.reason || x.problem || x.summary || x.title || ""),
      source: "USDA-FSIS PHA"
    })).filter(x => x.date)

    return NextResponse.json({ data: rows })
  }catch(e:any){
    return NextResponse.json({ data: [], error: true, errorDetail: String(e?.message || e) }, { status: 502 })
  }
}
