"use client"

import { useEffect, useState } from "react"

type Row = {
  key:string
  label:string
  status:"loading"|"live"|"fallback"|"error"
  count:number
  fetchedAt?:string
  latencyMs?:number
  detail?:string
}

export default function StatusPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [months, setMonths] = useState(6)

  useEffect(() => {
    let cancel = false
    async function ping(label:string, fn:()=>Promise<{count:number; fetchedAt?:string; status:"live"|"fallback"|"error"; detail?:string}>) {
      const t0 = performance.now()
      try {
        const r = await fn()
        return { label, status: r.status, count: r.count, fetchedAt: r.fetchedAt, latencyMs: Math.round(performance.now() - t0), detail: r.detail }
      } catch (e:any) {
        return { label, status: "error" as const, count: 0, fetchedAt: "", latencyMs: Math.round(performance.now() - t0), detail: String(e?.message||e) }
      }
    }

    async function load() {
      const items = await Promise.all([
        ping("CDC NORS", async () => {
          const r = await fetch(`/api/outbreaks?scope=US&months=${months}`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.data) ? r.j.data.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        }),
        ping("FDA openFDA", async () => {
          const r = await fetch(`/api/recalls?scope=US&months=${months}`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.data) ? r.j.data.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        }),
        ping("USDA FSIS", async () => {
          const r = await fetch(`/api/fsis?scope=US&months=${months}`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.data) ? r.j.data.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        }),
        ping("Wastewater (NWSS)", async () => {
          const r = await fetch(`/api/wastewater?scope=US&months=${months}`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.series) ? r.j.series.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        }),
        ping("FDA Enforcement (IRES)", async () => {
          const r = await fetch(`/api/fda-enforcement?months=${months}&classes=1,2,3,NC&center=CFSAN`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.data) ? r.j.data.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        }),
        ping("Import Refusals (FDA DD)", async () => {
          const r = await fetch(`/api/import-refusals?months=${months}`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.data) ? r.j.data.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        }),
        ping("Adverse Events (CAERS)", async () => {
          const r = await fetch(`/api/adverse-events?months=${months}&limit=50`).then(async res => ({ ok:res.ok, j: await res.json().catch(()=>({})) }))
          const c = Array.isArray(r.j?.data) ? r.j.data.length : 0
          const st = r.j?.error ? "error" : r.j?.fallback ? "fallback" : r.ok ? "live" : "error"
          return { count:c, fetchedAt:r.j?.fetchedAt, status:st, detail:r.j?.errorDetail }
        })
      ])
      if (!cancel) {
        setRows(items.map((it, i) => ({
          key: String(i),
          label: it.label,
          status: it.status,
          count: it.count,
          fetchedAt: it.fetchedAt,
          latencyMs: it.latencyMs,
          detail: it.detail
        })))
      }
    }
    load()
    return () => { cancel = true }
  }, [months, refreshKey])

  function chip(c:"loading"|"live"|"fallback"|"error"){
    if (c==="live") return "bg-green-100 text-green-700"
    if (c==="fallback") return "bg-yellow-100 text-yellow-700"
    if (c==="error") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">System status</h1>
        <p className="mt-3 text-gray-600">Live data feeds, last updated times, and any error details.</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="card p-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">Window</span>
            <button onClick={()=>setMonths(3)} className={`btn ${months===3?"btn-primary":"btn-outline"}`}>3 mo</button>
            <button onClick={()=>setMonths(6)} className={`btn ${months===6?"btn-primary":"btn-outline"}`}>6 mo</button>
            <button onClick={()=>setMonths(12)} className={`btn ${months===12?"btn-primary":"btn-outline"}`}>12 mo</button>
          </div>
          <button onClick={()=>setRefreshKey(k=>k+1)} className="btn btn-outline">Retry</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((r)=>(
            <div key={r.key} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.label}</div>
                <span className={`text-xs rounded-full px-2 py-1 ${chip(r.status)}`}>{r.status}</span>
              </div>
              <div className="mt-2 text-sm text-gray-700">Items: {r.count}</div>
              <div className="mt-1 text-xs text-gray-500">{r.fetchedAt ? new Date(r.fetchedAt).toLocaleString() : ""}{r.latencyMs ? ` • ${r.latencyMs} ms` : ""}</div>
              {r.detail ? <pre className="mt-3 whitespace-pre-wrap text-xs text-red-700 bg-red-50 p-2 rounded">{r.detail}</pre> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
