"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import CopyLink from "../../components/CopyLink"
import { ratePer100k } from "../../lib/rate"
import { track } from "../../lib/track"

type Outbreak = { id: string; date: string; state: string }
type Recall = { id: string; date: string; stateScope: string[] }

const STATES = [
  "WA","OR","CA","AK","HI","ID","NV","AZ","UT","MT","WY","CO","NM","ND","SD","NE","KS","OK","TX",
  "MN","IA","MO","AR","LA","WI","IL","MI","IN","KY","TN","MS","AL","FL","GA","SC","NC","VA","WV",
  "OH","PA","NY","VT","NH","ME","MA","RI","CT","NJ","DE","MD","DC"
]

// approximate tilegram positions for a simple SVG choropleth
const POS: Record<string, { x: number; y: number }> = {
  AK:{x:0,y:6}, HI:{x:1,y:6},
  WA:{x:1,y:1}, OR:{x:1,y:2}, CA:{x:1,y:3},
  ID:{x:2,y:2}, NV:{x:2,y:3}, AZ:{x:2,y:4}, UT:{x:3,y:3},
  MT:{x:3,y:1}, WY:{x:4,y:2}, CO:{x:4,y:3}, NM:{x:4,y:4},
  ND:{x:5,y:1}, SD:{x:5,y:2}, NE:{x:5,y:3}, KS:{x:5,y:4}, OK:{x:5,y:5}, TX:{x:5,y:6},
  MN:{x:6,y:1}, IA:{x:6,y:2}, MO:{x:6,y:3}, AR:{x:6,y:4}, LA:{x:6,y:5},
  WI:{x:7,y:1}, IL:{x:7,y:2}, MS:{x:7,y:5},
  MI:{x:8,y:1}, IN:{x:8,y:2}, KY:{x:8,y:3}, TN:{x:8,y:4}, AL:{x:8,y:5},
  OH:{x:9,y:2}, WV:{x:9,y:3}, GA:{x:9,y:5}, FL:{x:9,y:6},
  PA:{x:10,y:2}, VA:{x:10,y:3}, NC:{x:10,y:4}, SC:{x:10,y:5},
  NY:{x:11,y:1}, NJ:{x:11,y:2}, DE:{x:11,y:3}, MD:{x:11,y:4}, DC:{x:11,y:5},
  MA:{x:12,y:1}, CT:{x:12,y:2}, RI:{x:12,y:3},
  VT:{x:13,y:1}, NH:{x:13,y:2}, ME:{x:14,y:1}
}

export default function MapPage() {
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [domain, setDomain] = useState<"publicHealth" | "foodSafety">("publicHealth")
  const [mode, setMode] = useState<"tiles" | "choropleth">("tiles")

  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([])
  const [recallsFDA, setRecallsFDA] = useState<Recall[]>([])
  const [recallsFSIS, setRecallsFSIS] = useState<Recall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      try {
        const [ob, fda, fsis] = await Promise.all([
          fetch(`/api/outbreaks?scope=US&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`/api/recalls?scope=US&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`/api/fsis?scope=US&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({data:[]}))
        ])
        if (!cancel) {
          setOutbreaks((ob.data||[]).map((x:any)=>({ id:x.id, date:x.date, state:String(x.state||"").toUpperCase() })))
          setRecallsFDA((fda.data||[]).map((x:any)=>({ id:x.id, date:x.date, stateScope:(x.stateScope||[]).map((s:string)=>String(s).toUpperCase()) })))
          setRecallsFSIS((fsis.data||[]).map((x:any)=>({ id:x.id, date:x.date, stateScope:(x.stateScope||[]).map((s:string)=>String(s).toUpperCase()) })))
          setLoading(false)
        }
      } catch {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [monthsBack])

  // merge recalls
  const recallsAll = useMemo(() => [...recallsFDA, ...recallsFSIS], [recallsFDA, recallsFSIS])

  // counts per state
  const counts = useMemo(() => {
    const c = new Map<string, number>()
    STATES.forEach(s => c.set(s, 0))
    if (domain === "publicHealth") {
      for (const o of outbreaks) {
        const s = o.state
        if (c.has(s)) c.set(s, (c.get(s)||0) + 1)
      }
    } else {
      for (const r of recallsAll) {
        for (const s0 of (r.stateScope||[])) {
          const s = String(s0).toUpperCase()
          if (c.has(s)) c.set(s, (c.get(s)||0) + 1)
        }
      }
    }
    return c
  }, [domain, outbreaks, recallsAll])

  // rates per 100k (outbreak view)
  const rates = useMemo(() => {
    const m = new Map<string, number>()
    STATES.forEach(s => m.set(s, 0))
    if (domain === "publicHealth") {
      STATES.forEach(s => m.set(s, ratePer100k(s, counts.get(s)||0)))
    } else {
      // still compute per 100k for recalls; not perfect but informative
      STATES.forEach(s => m.set(s, ratePer100k(s, counts.get(s)||0)))
    }
    return m
  }, [counts, domain])

  const maxCount = useMemo(() => Math.max(1, ...Array.from(counts.values())), [counts])
  const maxRate  = useMemo(() => Math.max(1, ...Array.from(rates.values())), [rates])

  function onMode(next: "tiles" | "choropleth") {
    setMode(next)
    track("map_mode", { mode: next })
  }
  function onDomain(next: "publicHealth" | "foodSafety") {
    setDomain(next)
    track("map_filter", { domain: next, monthsBack })
  }
  function onMonths(next: number) {
    setMonthsBack(next)
    track("map_filter", { domain, monthsBack: next })
  }

  // ======== RENDER ========
  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">State view</h1>
        <p className="mt-3 text-gray-600">
          {mode === "tiles" ? "Counts by state" : "Choropleth by rate per 100k"} for {domain === "publicHealth" ? "outbreaks" : "recalls"} over the last {monthsBack} months.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={()=>onDomain("publicHealth")} className={`btn ${domain==="publicHealth"?"btn-primary":"btn-outline"}`}>Public health</button>
          <button onClick={()=>onDomain("foodSafety")}  className={`btn ${domain==="foodSafety" ?"btn-primary":"btn-outline"}`}>Food safety</button>
          <button onClick={()=>onMonths(3)}  className={`btn ${monthsBack===3 ?"btn-primary":"btn-outline"}`}>3 mo</button>
          <button onClick={()=>onMonths(6)}  className={`btn ${monthsBack===6 ?"btn-primary":"btn-outline"}`}>6 mo</button>
          <button onClick={()=>onMonths(12)} className={`btn ${monthsBack===12?"btn-primary":"btn-outline"}`}>12 mo</button>
          <button onClick={()=>onMode("tiles")} className={`btn ${mode==="tiles"?"btn-primary":"btn-outline"}`}>Tiles</button>
          <button onClick={()=>onMode("choropleth")} className={`btn ${mode==="choropleth"?"btn-primary":"btn-outline"}`}>Choropleth</button>
          <CopyLink />
        </div>
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 animate-pulse">
          {Array.from({length:60}).map((_,i)=><div key={i} className="card h-16" />)}
        </div>
      ) : mode === "tiles" ? (
        <>
          <div className="mt-10 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {STATES.map(s => {
              const v = counts.get(s) || 0
              const n = Math.max(0, Math.min(1, v / maxCount))
              const bg = `rgba(61,115,255,${0.2 + n*0.8})`
              const rate = rates.get(s) || 0
              return (
                <Link
                  key={s}
                  href={`/state/${s}?domain=${domain}&months=${monthsBack}`}
                  onClick={()=>track("state_click", { state:s, domain, monthsBack, mode:"tiles" })}
                  prefetch={false}
                  className="card p-3 text-center transition"
                  style={{ backgroundColor: bg, color: n>0.55?"white":"black" }}
                >
                  <div className="text-sm font-semibold">{s}</div>
                  <div className="text-lg font-bold">{v}</div>
                  <div className="text-xs opacity-90">{rate}/100k</div>
                </Link>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
            <span>Low</span>
            <div className="h-2 w-28 rounded" style={{ background: "linear-gradient(to right, rgba(61,115,255,0.2), rgba(61,115,255,1))" }} />
            <span>High</span>
            <span className="ml-3 text-gray-500">0–{maxCount} counts</span>
          </div>
        </>
      ) : (
        // choropleth (SVG tilegram)
        <>
          <div className="mt-10 card p-4 overflow-x-auto">
            <svg width={760} height={340}>
              {STATES.map(s => {
                const pos = POS[s]
                if (!pos) return null
                const rate = rates.get(s) || 0
                const t = Math.max(0, Math.min(1, rate / maxRate))
                const fill = `rgba(61,115,255,${0.15 + t*0.85})`
                const x = 30 + pos.x * 46
                const y = 20 + pos.y * 46
                return (
                  <a key={s} href={`/state/${s}?domain=${domain}&months=${monthsBack}`} onClick={()=>track("state_click", { state:s, domain, monthsBack, mode:"choropleth" })}>
                    <rect x={x} y={y} width={42} height={42} rx={8} ry={8} fill={fill} stroke="rgba(0,0,0,0.08)" />
                    <text x={x+21} y={y+18} textAnchor="middle" fontSize="11" fill={t>0.55?"white":"#111"} fontWeight="600">{s}</text>
                    <text x={x+21} y={y+34} textAnchor="middle" fontSize="10" fill={t>0.55?"white":"#334"}>{rate}/100k</text>
                  </a>
                )
              })}
              {/* legend */}
              <rect x={540} y={284} width={140} height={10} fill="url(#grad)" />
              <defs>
                <linearGradient id="grad">
                  <stop offset="0%" stopColor="rgba(61,115,255,0.15)"/>
                  <stop offset="100%" stopColor="rgba(61,115,255,1)"/>
                </linearGradient>
              </defs>
              <text x={540} y={306} fontSize="10" fill="#64748b">Low</text>
              <text x={664} y={306} fontSize="10" fill="#64748b">High</text>
              <text x={540} y={320} fontSize="10" fill="#64748b">0–{maxRate} per 100k</text>
            </svg>
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            Choropleth uses per-capita rate/100k for {domain === "publicHealth" ? "outbreaks" : "recalls"}. Click any state for details.
          </div>
        </>
      )}
    </section>
  )
}
