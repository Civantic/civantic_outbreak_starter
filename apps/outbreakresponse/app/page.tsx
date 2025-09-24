"use client"

import { useEffect, useMemo, useState } from "react"
import Filters from "../components/Filters"

type Scope = "US" | "NM"
type Domain = "publicHealth" | "foodSafety"
type Status = "loading" | "live" | "fallback" | "error"

type Outbreak = { id: string; date: string; state: string; etiology?: string; illnesses: number; hospitalizations: number; deaths?: number; source: string }
type Recall = { id: string; date: string; stateScope: string[]; product?: string; reason?: string; classification?: string; source: string }
type WWPoint = { date: string; value: number }

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` }
function addMonths(d: Date, m: number) { const dt = new Date(d); dt.setMonth(d.getMonth() + m); return dt }

export default function Page() {
  const [scope, setScope] = useState<Scope>("US")
  const [domain, setDomain] = useState<Domain>("publicHealth")
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [filters, setFilters] = useState<{ etiology:string; recallClass:string; productQ:string }>({ etiology:"", recallClass:"", productQ:"" })
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([])
  const [recallsFDA, setRecallsFDA] = useState<Recall[]>([])
  const [recallsFSIS, setRecallsFSIS] = useState<Recall[]>([])
  const [status, setStatus] = useState<{ cdc: Status; fda: Status; fsis: Status }>({ cdc: "loading", fda: "loading", fsis: "loading" })
  const [wwSeries, setWwSeries] = useState<WWPoint[]>([])
  const [wwStatus, setWwStatus] = useState<Status>("loading")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setStatus({ cdc: "loading", fda: "loading", fsis: "loading" })
      setWwStatus("loading")
      try {
        const obUrl = `/api/outbreaks?scope=${scope}&months=${monthsBack}${filters.etiology?`&etiology=${encodeURIComponent(filters.etiology)}`:""}`
        const fdaUrl = `/api/recalls?scope=${scope}&months=${monthsBack}${filters.recallClass?`&class=${encodeURIComponent(filters.recallClass)}`:""}${filters.productQ?`&product_q=${encodeURIComponent(filters.productQ)}`:""}`

        const [ob, fda, fsis, ww] = await Promise.all([
          fetch(obUrl, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [], fallback: true, error: true })),
          fetch(fdaUrl, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [], fallback: true, error: true })),
          fetch(`/api/fsis?scope=${scope}&months=${monthsBack}`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [], fallback: true, error: true })),
          fetch(`/api/wastewater?scope=${scope}&months=${monthsBack}`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ series: [], fallback: true, error: true }))
        ])

        if (!cancelled) {
          setOutbreaks(ob.data || [])
          setRecallsFDA(fda.data || [])
          setRecallsFSIS(fsis.data || [])
          setWwSeries(ww.series || [])
          setStatus({
            cdc: (ob as any).error ? "error" : (ob as any).fallback ? "fallback" : "live",
            fda: (fda as any).error ? "error" : (fda as any).fallback ? "fallback" : "live",
            fsis: (fsis as any).error ? "error" : (fsis as any).fallback ? "fallback" : "live"
          })
          setWwStatus((ww as any).error ? "error" : (ww as any).fallback ? "fallback" : "live")
        }
      } catch {
        if (!cancelled) {
          setStatus({ cdc: "error", fda: "error", fsis: "error" })
          setWwStatus("error")
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [scope, monthsBack, filters, refreshKey])

  const months = useMemo(() => {
    const now = new Date()
    const arr = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const x = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -i)
      arr.push({ key: monthKey(x), label: x.toLocaleString("en-US", { month: "short" }) })
    }
    return arr
  }, [monthsBack])

  const recallsAll = useMemo(() => [...recallsFDA, ...recallsFSIS], [recallsFDA, recallsFSIS])

  const kpi = useMemo(() => {
    const obCount = outbreaks.length
    const hosp = outbreaks.reduce((a, b) => a + (b.hospitalizations || 0), 0)
    const rcCount = recallsAll.length
    return { obCount, hosp, rcCount }
  }, [outbreaks, recallsAll])

  const seriesOutbreaks = useMemo(() => {
    const map = new Map(months.map(m => [m.key, 0]))
    outbreaks.forEach(o => {
      const dt = new Date(o.date)
      const k = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1))
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1)
    })
    return months.map(m => ({ label: m.label, value: map.get(m.key) || 0 }))
  }, [outbreaks, months])

  const recent = useMemo(() => {
    if (domain === "publicHealth") {
      return [...outbreaks].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6).map(x => ({
        date: x.date,
        jurisdiction: x.state || scope,
        title: `${x.etiology || "Outbreak"}`,
        metrics: `${x.illnesses || 0} ill · ${x.hospitalizations || 0} hosp${x.deaths ? " · " + x.deaths + " deaths" : ""}`,
        source: x.source
      }))
    } else {
      return [...recallsAll].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6).map(x => ({
        date: x.date,
        jurisdiction: x.stateScope.join(", "),
        title: x.product || "Recall",
        metrics: x.reason || "",
        source: x.source
      }))
    }
  }, [domain, outbreaks, recallsAll, scope])

  const wwBars = useMemo(() => {
    const s = [...wwSeries].sort((a, b) => +new Date(a.date) - +new Date(b.date)).slice(-12)
    const max = Math.max(1, ...s.map(p => p.value || 0))
    return s.map(p => ({ h: 4 + Math.round((p.value || 0) / max * 36) }))
  }, [wwSeries])

  function chip(c: Status) {
    if (c === "live") return "bg-green-100 text-green-700"
    if (c === "fallback") return "bg-yellow-100 text-yellow-700"
    if (c === "error") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  function exportRecentCSV() {
    const rows = [["date","jurisdiction","title","metrics","source"], ...recent.map(r => [r.date, r.jurisdiction, r.title, r.metrics, r.source])]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${domain}_${scope}_${monthsBack}m_recent.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loading = status.cdc === "loading" && status.fda === "loading" && status.fsis === "loading" && wwStatus === "loading"
  const noData = !loading && outbreaks.length === 0 && recallsAll.length === 0

  return (
    <div>
      <section className="container py-16 md:py-20" id="dashboard">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600">
            <span>National and New Mexico views</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">Outbreaks and hospitalizations at a glance</h1>
          <p className="mt-4 text-lg text-gray-600">Public health outbreaks and food safety recalls with simple filters and ready KPIs.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 ${chip(status.cdc)}`}>CDC NORS {status.cdc}</span>
            <span className={`rounded-full px-3 py-1 ${chip(status.fda)}`}>FDA openFDA {status.fda}</span>
            <span className={`rounded-full px-3 py-1 ${chip(status.fsis)}`}>USDA FSIS {status.fsis}</span>
            <span className={`rounded-full px-3 py-1 ${chip(wwStatus)}`}>Wastewater {wwStatus}</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={() => setRefreshKey(k => k + 1)} className="btn btn-outline">Retry</button>
            <button onClick={exportRecentCSV} className="btn btn-outline">Export recent CSV</button>
          </div>
        </div>

        <div className="mt-8 container">
          <div className="flex flex-wrap items-center gap-2">
            <div className="card p-2">
              <div className="flex gap-2">
                <button onClick={() => setScope("US")} className={`btn ${scope === "US" ? "btn-primary" : "btn-outline"}`}>United States</button>
                <button onClick={() => setScope("NM")} className={`btn ${scope === "NM" ? "btn-primary" : "btn-outline"}`}>New Mexico</button>
              </div>
            </div>
            <div className="card p-2">
              <div className="flex gap-2">
                <button onClick={() => setDomain("publicHealth")} className={`btn ${domain === "publicHealth" ? "btn-primary" : "btn-outline"}`}>Public health</button>
                <button onClick={() => setDomain("foodSafety")} className={`btn ${domain === "foodSafety" ? "btn-primary" : "btn-outline"}`}>Food safety</button>
              </div>
            </div>
            <div className="card p-2">
              <div className="flex gap-2">
                <button onClick={() => setMonthsBack(3)} className={`btn ${monthsBack === 3 ? "btn-primary" : "btn-outline"}`}>3 mo</button>
                <button onClick={() => setMonthsBack(6)} className={`btn ${monthsBack === 6 ? "btn-primary" : "btn-outline"}`}>6 mo</button>
                <button onClick={() => setMonthsBack(12)} className={`btn ${monthsBack === 12 ? "btn-primary" : "btn-outline"}`}>12 mo</button>
              </div>
            </div>
            <Filters onChange={setFilters} />
          </div>

          {loading && (
            <div className="mt-6 grid gap-6 md:grid-cols-4 animate-pulse">
              <div className="card p-6 h-36" />
              <div className="card p-6 h-36" />
              <div className="card p-6 h-36" />
              <div className="card p-6 h-36" />
            </div>
          )}

          {!loading && noData && (
            <div className="mt-6 card p-6 text-sm text-gray-700">
              No recent items yet for this selection. Try a longer date range, change filters, or click Retry.
            </div>
          )}

          {!loading && !noData && (
            <>
              <div className="mt-6 grid gap-6 md:grid-cols-4">
                <div className="card p-6">
                  <div className="text-sm text-gray-600">Outbreaks</div>
                  <div className="mt-1 text-3xl font-bold">{kpi.obCount}</div>
                  <div className="mt-4 h-16 flex items-end gap-2">
                    {seriesOutbreaks.map((d, i) => (
                      <div key={i} className="flex-1 rounded bg-brand-200" style={{ height: `${d.value === 0 ? 4 : 10 + d.value * 10}px` }} />
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Last {monthsBack} months</div>
                </div>
                <div className="card p-6">
                  <div className="text-sm text-gray-600">Hospitalizations</div>
                  <div className="mt-1 text-3xl font-bold">{kpi.hosp}</div>
                  <div className="mt-2 text-xs text-gray-500">From reported outbreaks</div>
                </div>
                <div className="card p-6">
                  <div className="text-sm text-gray-600">Recalls</div>
                  <div className="mt-1 text-3xl font-bold">{recallsAll.length}</div>
                  <div className="mt-2 text-xs text-gray-500">FDA + FSIS</div>
                </div>
                <div className="card p-6">
                  <div className="text-sm text-gray-600">Wastewater signal</div>
                  <div className="mt-1 text-3xl font-bold">{wwSeries.slice(-1)[0]?.value ? Math.round(wwSeries.slice(-1)[0].value) : 0}</div>
                  <div className="mt-4 h-16 flex items-end gap-1">
                    {wwBars.map((d, i) => <div key={i} className="flex-1 rounded bg-brand-200" style={{ height: `${d.h}px` }} />)}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Recent samples</div>
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <div className="font-semibold">Recent {domain === "publicHealth" ? "outbreaks" : "recalls"}</div>
                  <div className="mt-4 divide-y">
                    {recent.map((r, i) => (
                      <div key={i} className="py-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()} · {r.jurisdiction}</div>
                          <div className="font-medium">{r.title}</div>
                        </div>
                        <div className="text-sm text-gray-700">{r.metrics}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UPDATED: Data sources card */}
                <div className="card p-6">
                  <div className="font-semibold">Data sources (live & planned)</div>
                  <div className="mt-3 grid gap-3 text-sm">
                    <div>
                      <div className="font-medium">Live</div>
                      <ul className="mt-1 space-y-1 text-gray-700">
                        <li>• CDC NORS — outbreaks, illnesses, hospitalizations</li>
                        <li>• FDA openFDA — recalls (product, reason, states, class)</li>
                        <li>• USDA-FSIS — meat & poultry recalls</li>
                        <li>• CDC NWSS — wastewater percentile trend</li>
                        <li>• Adverse Events (openFDA CAERS) — complaints for foods/dietary supplements</li>
                        <li>• NM DOH curated updates — manually added links when relevant</li>
                        <li>• FDA Data Dashboard — import refusals (pilot)</li>
                        <li>• FDA Enforcement (IRES) — enforcement report drill-down (pilot)</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <div className="font-medium">Planned</div>
                      <ul className="mt-1 space-y-1 text-gray-700">
                        <li>• FSIS Public Health Alerts (PHAs)</li>
                        <li>• FDA Warning Letters (Food)</li>
                        <li>• SVI & population overlays for equity-aware views</li>
                        <li>• Nightly cache to improve speed and reliability</li>
                        <li>• Alerts and PDF snapshot exports</li>
                      </ul>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Note: counts reflect public summaries and may lag official updates. Nationwide recalls are counted for all states listed by the agency.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
