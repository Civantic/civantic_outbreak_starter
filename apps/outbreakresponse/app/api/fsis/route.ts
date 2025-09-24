import { NextResponse } from "next/server"

type RecallItem = {
  id: string
  date: string
  stateScope: string[]
  product: string
  reason: string
  source: string
}

const STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],["DC","District of Columbia"]
]
const ALL_STATES = STATES.map(s=>s[0])

function parseStates(val: any) {
  if (Array.isArray(val)) {
    const norm = new Set<string>()
    for (const v of val) {
      const t = String(v || "").toLowerCase().trim()
      const ab = STATES.find(s => s[0].toLowerCase() === t)
      const nm = STATES.find(s => s[1].toLowerCase() === t)
      if (ab) norm.add(ab[0]); else if (nm) norm.add(nm[0])
    }
    return Array.from(norm)
  }
  const s = String(val || "")
  const t = s.toLowerCase()
  if (/(nationwide|national)/.test(t)) return ALL_STATES
  const out = new Set<string>()
  for (const [abbr, name] of STATES) {
    const a = new RegExp(`\\b${abbr.toLowerCase()}\\b`)
    const n = new RegExp(name.toLowerCase())
    if (a.test(t) || n.test(t)) out.add(abbr)
  }
  return Array.from(out)
}

function toISO(d: any) {
  const s = String(d || "").trim()
  if (!s) return ""
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`
  const m2 = s.match(/^(\d{8})$/)
  if (m2) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
  const dt = new Date(s)
  return isNaN(+dt) ? "" : dt.toISOString().slice(0,10)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scope = (searchParams.get("scope") || "US").toUpperCase()
  const monthsBack = Number(searchParams.get("months") || "6")
  const end = new Date()
  const start = new Date(end)
  start.setMonth(end.getMonth() - monthsBack)

  try {
    const base = process.env.FSIS_API_URL || ""
    if (!base) throw new Error("no fsis url")
    const res = await fetch(base, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(String(res.status))
    const raw = await res.json()
    const list = Array.isArray(raw) ? raw : (raw.items || raw.results || [])
    let rows: RecallItem[] = list.map((r: any) => {
      const states = parseStates(r.states || r.state || r.states_affected || r.state_distribution || r.distribution || r.distribution_pattern)
      const date = toISO(r.recall_initiation_date || r.recall_date || r.start_date || r.date)
      return {
        id: r.recall_number || r.id || r.recall_id || r.event_id || crypto.randomUUID(),
        date,
        stateScope: states,
        product: String(r.product_description || r.product || r.product_name || ""),
        reason: String(r.reason || r.problem || r.reason_for_recall || r.summary || r.title || ""),
        source: "USDA-FSIS"
      }
    }).filter(x => !!x.date)
    rows = rows.filter(x => new Date(x.date) >= start && new Date(x.date) <= end)
    if (scope === "NM") rows = rows.filter(r => r.stateScope.includes("NM") || r.stateScope.length === ALL_STATES.length)
    return NextResponse.json({ data: rows })
  } catch {
    const { recalls: demo } = await import("../../data/demo")
    return NextResponse.json({ data: demo, fallback: true })
  }
}
