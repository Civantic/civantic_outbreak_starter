"use client"

import { useEffect, useMemo, useState } from "react"
import CopyLink from "../../components/CopyLink"

type Ev = { id:string; date:string; products:string[]; reactions:string[]; reporter?:string; source:string }

export default function AdverseEventsPage() {
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [productQ, setProductQ] = useState<string>("")
  const [events, setEvents] = useState<Ev[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("months", String(monthsBack))
      if (productQ) params.set("product_q", productQ)
      try {
        const r = await fetch(`/api/adverse-events?${params.toString()}`, { cache: "no-store" })
        const j = await r.json()
        if (!cancel) {
          setEvents(j.data || [])
          setLoading(false)
        }
      } catch {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [monthsBack, productQ])

  const topProducts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of events) {
      const seen = new Set<string>()
      for (const p of e.products) {
        const key = p.trim()
        if (!key || seen.has(key)) continue
        seen.add(key)
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }
    return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10)
  }, [events])

  function exportCSV() {
    const rows = [["date","products","reactions","reporter","id"],
      ...events.map(e => [e.date, e.products.join("|"), e.reactions.join("|"), e.reporter || "", e.id])]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a"); a.href = url; a.download = `adverse_events_${monthsBack}m${productQ?`_${productQ}`:""}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Adverse events (CAERS)</h1>
          <p className="mt-2 text-gray-600">Public complaints to FDA about foods and dietary supplements. Useful as an early signal alongside recalls.</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="card p-2">
            <button onClick={()=>setMonthsBack(3)} className={`btn ${monthsBack===3?"btn-primary":"btn-outline"}`}>3 mo</button>
            <button onClick={()=>setMonthsBack(6)} className={`btn ${monthsBack===6?"btn-primary":"btn-outline"}`}>6 mo</button>
            <button onClick={()=>setMonthsBack(12)} className={`btn ${monthsBack===12?"btn-primary":"btn-outline"}`}>12 mo</button>
          </div>
          <div className="card p-2">
            <input value={productQ} onChange={e=>setProductQ(e.target.value)} placeholder="Product contains…" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <button onClick={exportCSV} className="btn btn-outline">Export CSV</button>
          <CopyLink />
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length:6}).map((_,i)=><div key={i} className="card p-6 h-36 animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 card p-6 text-sm text-gray-700">No events in this window.</div>
        ) : (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <div className="font-semibold">Top product mentions</div>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {topProducts.map(([p,c])=>(
                    <li key={p} className="flex items-center justify-between">
                      <span className="truncate">{p}</span>
                      <span className="text-gray-600">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <div className="font-semibold">Recent reports</div>
                <div className="mt-3 divide-y">
                  {events.slice(0,15).map(e=>(
                    <div key={e.id} className="py-3 text-sm">
                      <div className="text-gray-500">{e.date ? new Date(e.date).toLocaleDateString() : "—"}</div>
                      <div className="font-medium">{e.products.join(", ") || "Event"}</div>
                      <div className="text-gray-700">{e.reactions.slice(0,3).join(", ")}</div>
                      {e.reporter ? <div className="text-xs text-gray-500">Reporter: {e.reporter}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
