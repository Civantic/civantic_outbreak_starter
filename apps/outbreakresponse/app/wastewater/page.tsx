"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Pt = { date: string; value: number; n: number }
type Resp = { series: Pt[]; latest?: number; changePct?: number; samples?: number; fetchedAt?: string }
type Fc = { date: string; value: number }

export default function WastewaterPage() {
  const [scope, setScope] = useState<"US" | "NM">("US")
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [compare, setCompare] = useState<boolean>(false)

  const [us, setUS] = useState<Resp>({ series: [] })
  const [nm, setNM] = useState<Resp>({ series: [] })
  const [forecast, setForecast] = useState<Fc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      try {
        const [rUS, rNM] = await Promise.all([
          fetch(`/api/wastewater?scope=US&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({series:[]})),
          fetch(`/api/wastewater?scope=NM&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({series:[]}))
        ])
        if (!cancel) { setUS(rUS); setNM(rNM) }
      } catch {}
      try {
        const f = await fetch(`/api/wastewater-nowcast?scope=${scope}&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({forecast:[]}))
        if (!cancel) setForecast(Array.isArray(f.forecast)?f.forecast:[])
      } catch {}
      if (!cancel) setLoading(false)
    }
    load()
    return () => { cancel = true }
  }, [monthsBack, scope])

  const active = scope === "US" ? us : nm

  const stat = useMemo(() => {
    const s = active.series
    const days = s.length
    const samples = Number(active.samples || s.reduce((a,b)=>a+(b.n||0),0))
    const avgSamples = days ? Math.round(samples / days) : 0
    const pct75 = days ? Math.round((s.filter(p=>p.value>=75).length / days) * 100) : 0
    const pct90 = days ? Math.round((s.filter(p=>p.value>=90).length / days) * 100) : 0
    const latest = Math.round(active.latest ?? (s.slice(-1)[0]?.value ?? 0))
    const changePct = Math.round((active.changePct ?? 0))
    const fetchedAt = active.fetchedAt || ""
    return { days, samples, avgSamples, pct75, pct90, latest, changePct, fetchedAt }
  }, [active])

  const svg = useMemo(() => {
    const w = 920, h = 260, m = { l: 48, r: 16, t: 20, b: 34 }
    function build(series: {date:string; value:number}[]) {
      if (!series.length) return { path: "", pts: [] as {x:number;y:number;d:{date:string;value:number}}[] }
      const xs = series.map(d => +new Date(d.date)), xMin = Math.min(...xs), xMax = Math.max(...xs)
      const X = (t:number) => m.l + ((t - xMin) / Math.max(1,(xMax - xMin))) * (w - m.l - m.r)
      const Y = (v:number) => h - m.b - (Math.max(0, Math.min(100, v))/100) * (h - m.t - m.b)
      const path = series.map((d,i)=>`${i===0?"M":"L"}${X(+new Date(d.date)).toFixed(1)},${Y(d.value).toFixed(1)}`).join(" ")
      const pts = series.map(d=>({ x:X(+new Date(d.date)), y:Y(d.value), d }))
      return { path, pts, X, Y, xMin, xMax }
    }
    const baseUS = build(us.series)
    const baseNM = build(nm.series)
    const xsAll = [...us.series, ...nm.series, ...forecast].map(d=>+new Date(d.date))
    const xMin = Math.min(...xsAll, +new Date()), xMax = Math.max(...xsAll, +new Date())
    const XTick = (t:number) => m.l + ((t - xMin) / Math.max(1,(xMax - xMin))) * (w - m.l - m.r)
    const xTicksRaw = [xMin, xMin+(xMax-xMin)/2, xMax]
    const xTicks = xTicksRaw.map(XTick)
    const xLabels = xTicksRaw.map(t => new Date(t).toLocaleDateString())
    const yTicks = [0,25,50,75,90,100]
    return { w, h, m, baseUS, baseNM, xTicks, xLabels, yTicks, xMin, xMax, XTick }
  }, [us.series, nm.series, forecast])

  const [hover, setHover] = useState<{ series:"US"|"NM"|"FC"; x:number;y:number; d:{date:string;value:number} } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent) {
    if (!chartRef.current) return
    const sets: { series:"US"|"NM"|"FC"; pts: {x:number;y:number;d:{date:string;value:number}}[] }[] = []
    const sUS = svg.baseUS.pts, sNM = svg.baseNM.pts
    const fcPts = forecast.map(d => {
      const xs = svg.XTick(+new Date(d.date))
      const ys = svg.baseUS.pts.length ? svg.baseUS.pts[0].y : svg.baseNM.pts[0]?.y
      return { x: xs, y: svg.baseUS.Y?.(d.value) ?? svg.baseNM.Y?.(d.value) ?? (svg.h-34), d }
    })
    if (compare) { sets.push({ series:"US", pts:sUS }, { series:"NM", pts:sNM }) }
    else { sets.push({ series: scope, pts: scope==="US" ? sUS : sNM }) }
    if (forecast.length) sets.push({ series:"FC", pts: fcPts as any })

    const rect = chartRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    let best: any = null, min = Infinity
    for (const set of sets) for (const p of set.pts) { const d = Math.abs(px - p.x); if (d < min) { min = d; best = { series:set.series, x:p.x, y:p.y, d:p.d } } }
    setHover(best)
  }
  function onLeave(){ setHover(null) }

  const sampleBars = useMemo(() => {
    const s = active.series.slice(-Math.min(active.series.length, 24))
    const maxN = Math.max(1, ...s.map(p => p.n||0))
    return { s, maxN }
  }, [active.series])

  function exportCSV() {
    const rows = [["date","percentile","samples"], ...active.series.map(p => [p.date, String(Math.round(p.value)), String(p.n)])]
    const url = URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a"); a.href = url; a.download = `wastewater_${scope}_${monthsBack}m.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const trend = stat.changePct > 5 ? "Rising" : stat.changePct < -5 ? "Falling" : "Stable"

  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Wastewater signal</h1>
        <p className="mt-2 text-gray-700">
          This shows the wastewater percentile (0–100). It compares today’s signal to a site’s own history (not case counts). Higher = more signal relative to baseline.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="card p-6"><div className="text-sm text-gray-600">Latest percentile</div><div className="mt-1 text-3xl font-bold">{stat.latest}</div></div>
          <div className="card p-6"><div className="text-sm text-gray-600">7-day vs prior 7-day</div><div className="mt-1 text-3xl font-bold">{stat.changePct}%</div><div className="text-xs text-gray-500 mt-1">{trend}</div></div>
          <div className="card p-6"><div className="text-sm text-gray-600">Samples aggregated</div><div className="mt-1 text-3xl font-bold">{stat.samples}</div><div className="text-xs text-gray-500 mt-1">{stat.fetchedAt ? new Date(stat.fetchedAt).toLocaleString() : ""}</div></div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={()=>setScope("US")} className={`btn ${scope==="US"?"btn-primary":"btn-outline"}`}>United States</button>
          <button onClick={()=>setScope("NM")} className={`btn ${scope==="NM"?"btn-primary":"btn-outline"}`}>New Mexico</button>
          <button onClick={()=>setMonthsBack(3)} className={`btn ${monthsBack===3?"btn-primary":"btn-outline"}`}>3 mo</button>
          <button onClick={()=>setMonthsBack(6)} className={`btn ${monthsBack===6?"btn-primary":"btn-outline"}`}>6 mo</button>
          <button onClick={()=>setMonthsBack(12)} className={`btn ${monthsBack===12?"btn-primary":"btn-outline"}`}>12 mo</button>
          <button onClick={()=>setCompare(c=>!c)} className={`btn ${compare?"btn-primary":"btn-outline"}`}>{compare ? "Compare US vs NM: ON" : "Compare US vs NM"}</button>
          <button onClick={exportCSV} className="btn btn-outline">Export CSV</button>
        </div>

        {loading ? (
          <div className="mt-8 card p-10 animate-pulse">Loading…</div>
        ) : active.series.length === 0 ? (
          <div className="mt-8 card p-6 text-sm text-gray-700">No data in the selected window.</div>
        ) : (
          <>
            <div className="mt-8 card p-6">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Wastewater percentile over time</div>
                <div className="text-xs text-gray-500">Guide: 25, 50, 75, 90, 100 · Forecast shown as dotted line</div>
              </div>
              <div ref={chartRef} className="relative overflow-x-auto" onMouseMove={onMove} onMouseLeave={onLeave}>
                <svg width={svg.w} height={svg.h}>
                  <rect x={0} y={0} width={svg.w} height={svg.h} fill="white" />
                  {svg.yTicks.map((yt,i)=>(
                    <g key={i}>
                      <line x1={svg.m.l} y1={svg.h-34-(yt/100)*(svg.h-svg.t-svg.b)} x2={svg.w-svg.m.r} y2={svg.h-34-(yt/100)*(svg.h-svg.t-svg.b)} stroke="#eef2f7" />
                      <text x={12} y={svg.h-34-(yt/100)*(svg.h-svg.t-svg.b)+4} fontSize="10" fill="#64748b">{yt}</text>
                    </g>
                  ))}
                  <line x1={svg.m.l} y1={svg.h-34} x2={svg.w-svg.m.r} y2={svg.h-34} stroke="#e5e7eb" />
                  {/* actual lines */}
                  <path d={svg.baseUS.path} fill="none" stroke={compare ? "rgba(61,115,255,0.75)" : scope==="US" ? "rgb(61,115,255)" : "rgba(61,115,255,0.25)"} strokeWidth="3" />
                  <path d={svg.baseNM.path} fill="none" stroke={compare ? "rgba(34,197,94,0.85)" : scope==="NM" ? "rgb(34,197,94)" : "rgba(34,197,94,0.25)"} strokeWidth="3" />

                  {/* forecast as dotted */}
                  {forecast.length ? (
                    <path
                      d={`M${forecast.map((d,i)=>{
                        const x = svg.XTick(+new Date(d.date))
                        // reuse Y from whichever series is in view
                        const y = svg.baseUS.pts.length ? svg.baseUS.pts[0].y : svg.baseNM.pts[0]?.y
                        const Y = svg.baseUS.pts.length ? (v:number)=>svg.baseUS.pts[0].y - ( (v - 0) / 100 ) * ((svg.baseUS.pts[0].y - (svg.h-34)) ) : (v:number)=>svg.baseNM.pts[0].y - ( (v - 0) / 100 ) * ((svg.baseNM.pts[0].y - (svg.h-34)) )
                        return `${i===0?"":" "}${x.toFixed(1)},${(Y(d.value)).toFixed(1)}`
                      }).join(" L")}`}
                      fill="none"
                      stroke="rgba(2,6,23,.55)"
                      strokeWidth="2"
                      strokeDasharray="6 6"
                    />
                  ) : null}

                  {hover ? (
                    <>
                      <line x1={hover.x} y1={20} x2={hover.x} y2={svg.h-34} stroke="rgba(2,6,23,.25)" />
                      <circle cx={hover.x} cy={hover.y} r={4} fill={hover.series==="US" ? "rgb(61,115,255)" : hover.series==="NM" ? "rgb(34,197,94)" : "rgba(2,6,23,.6)"} />
                    </>
                  ) : null}

                  {svg.xTicks.map((tx,i)=>(
                    <text key={i} x={tx} y={svg.h-10} fontSize="10" textAnchor="middle" fill="#64748b">{svg.xLabels[i]}</text>
                  ))}
                  <text x={0} y={14} fontSize="11" fill="#334155">Percentile (0–100)</text>
                </svg>
                {compare ? (
                  <div className="absolute right-3 top-3 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[rgb(61,115,255)]" /> US</span>
                    <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[rgb(34,197,94)]" /> NM</span>
                    {forecast.length ? <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[rgba(2,6,23,.6)]" /> Forecast</span> : null}
                  </div>
                ) : forecast.length ? (
                  <div className="absolute right-3 top-3 text-xs"><span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[rgba(2,6,23,.6)]" /> Forecast</span></div>
                ) : null}

                {hover ? (
                  <div style={{ left: Math.min(Math.max(hover.x - 60, 8), svg.w - 140), top: 8 }} className="absolute rounded-md border bg-white/95 px-3 py-2 text-xs shadow">
                    <div className="font-medium">{new Date(hover.d.date).toLocaleDateString()}</div>
                    <div className="mt-1 text-gray-700">{hover.series==="FC" ? "Forecast" : "Percentile"}: {Math.round(hover.d.value)}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="card p-6"><div className="text-sm text-gray-600">Reporting days</div><div className="mt-1 text-3xl font-bold">{stat.days}</div></div>
              <div className="card p-6"><div className="text-sm text-gray-600">Avg samples/day</div><div className="mt-1 text-3xl font-bold">{stat.avgSamples}</div></div>
              <div className="card p-6"><div className="text-sm text-gray-600">% days ≥ 75 / ≥ 90</div><div className="mt-1 text-3xl font-bold">{stat.pct75}% / {stat.pct90}%</div></div>
            </div>

            <div className="mt-6 card p-6">
              <div className="font-semibold">Samples per day (last 24 dates)</div>
              <div className="mt-3 h-16 flex items-end gap-1">
                {sampleBars.s.map((p,i)=>(
                  <div key={i} className="flex-1 rounded bg-brand-200" title={`${p.date}: ${p.n} samples`} style={{ height: `${4 + Math.round((p.n||0)/sampleBars.maxN*36)}px` }} />
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">More samples = more reporting coverage for that day.</div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
