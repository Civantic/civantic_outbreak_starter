export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

type Row = { id:string; date:string; stateScope:string[]; product:string; reason:string; source:string }

// US states list + DC
const STATES:[string,string][]= [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],
  ["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],
  ["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],["DC","District of Columbia"]
]
const ALL = STATES.map(s=>s[0])

function toISO(s:any){
  const t = String(s||"").trim()
  if (!t) return ""
  const m1 = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`
  const m2 = t.match(/^(\d{8})$/); if (m2) return `${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}`
  const d = new Date(t); return isNaN(+d) ? "" : d.toISOString().slice(0,10)
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

async function fetchWithTimeout(url:string, ms=9000) {
  const ctrl = new AbortController()
  const id = setTimeout(()=>ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal, next: { revalidate: 300 }, headers: { "Accept": "application/json" } })
  } finally {
    clearTimeout(id)
  }
}

export async function GET(req: Request){
  const u = new URL(req.url)
  const scope = (u.searchParams.get("scope") || "US").toUpperCase()
  const months = Number(u.searchParams.get("months") || "6")
  const end = new Date()
  const start = new Date(end); start.setMonth(end.getMonth() - months)

  const base = (process.env.FSIS_API_URL || "https://www.fsis.usda.gov/fsis/api/recall/v/1").replace(/\/+$/,"")

  try{
    // Try a smaller payload variant first (if API supports it), then fall back to base
    const tryUrls = [
      `${base}?limit=200`,
      base
    ]

    let raw: any = null
    let lastStatus = 0
    let lastText = ""

    for (const url of tryUrls) {
      try {
        const r = await fetchWithTimeout(url, 9000)
        lastStatus = r.status
        if (!r.ok) {
          lastText = await r.text()
          continue
        }
        raw = await r.json()
        break
      } catch (e:any) {
        lastText = String(e?.message || e || "")
        // try next
      }
    }

    if (!raw) {
      const res = NextResponse.json({ data: [], fallback: true, error: false, errorDetail: `FSIS ${lastStatus}: ${lastText.slice(0,300)}` })
      res.headers.set("Cache-Control","s-maxage=120, stale-while-revalidate=300")
      return res
    }

    const list: any[] = Array.isArray(raw) ? raw : (raw.items || raw.results || [])
    let rows: Row[] = list.map((x:any) => ({
      id: x.recall_number || x.id || x.recall_id || x.event_id || crypto.randomUUID(),
      date: toISO(x.recall_initiation_date || x.recall_date || x.start_date || x.date),
      stateScope: parseStates(x.states || x.state || x.states_affected || x.state_distribution || x.distribution || x.distribution_pattern),
      product: String(x.product_description || x.product || x.product_name || ""),
      reason: String(x.reason || x.problem || x.reason_for_recall || x.summary || x.title || ""),
      source: "USDA-FSIS"
    })).filter(x => x.date)

    rows = rows.filter(x => new Date(x.date) >= start && new Date(x.date) <= end)
    if (scope === "NM") rows = rows.filter(r => r.stateScope.includes("NM") || r.stateScope.length === ALL.length)

    const res = NextResponse.json({ data: rows, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control","s-maxage=600, stale-while-revalidate=900")
    return res
  }catch(e:any){
    const msg = String(e?.message || e || "")
    const res = NextResponse.json({ data: [], fallback: true, error: false, errorDetail: msg })
    res.headers.set("Cache-Control","s-maxage=120, stale-while-revalidate=300")
    return res
  }
}
