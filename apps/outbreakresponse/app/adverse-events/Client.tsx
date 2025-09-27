"use client"

import { useEffect, useMemo, useState } from "react"
import CopyLink from "../../components/CopyLink"

type Ev = {
  id: string
  date: string
  products: string[]
  reactions: string[]
  reporter?: string
  source: string
}

type ApiResp = { data: Ev[]; fallback?: boolean; error?: boolean; detail?: string }

export default function AdverseEventsClient() {
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [events, setEvents] = useState<Ev[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [apiStatus, setApiStatus] = useState<"live" | "fallback" | "error" | "loading">("loading")
  const [searchProduct, setSearchProduct] = useState<string>("")
  const [searchReaction, setSearchReaction] = useState<string>("")

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      setApiStatus("loading")
      try {
        const r = await fetch(`/api/adverse-events?months=${monthsBack}`)
        const j: ApiResp = await r.json()
        if (!cancel) {
          setEvents(Array.isArray(j.data) ? j.data : [])
          setApiStatus(j.error ? "error" : j.fallback ? "fallback" : "live")
          setLoading(false)
        }
      } catch {
        if (!cancel) {
          setEvents([])
          setApiStatus("error")
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancel = true
    }
  }, [monthsBack])

  const filtered = useMemo(() => {
    const p = searchProduct.trim().toLowerCase()
    const rx = searchReaction.trim().toLowerCase()
    return events.filter(ev => {
      const pHit = !p || ev.products.some(name => String(name).toLowerCase().includes(p))
      const rHit = !rx || ev.reactions.some(name => String(name).toLowerCase().includes(rx))
      return pHit && rHit
    })
  }, [events, searchProduct, searchReaction])

  const kpi = useMemo(() => {
    const total = filtered.length
    const prodCounts = new Map<string, number>()
    const reactCounts = new Map<string, number>()
    for (const ev of filtered) {
      for (const p of ev.products || []) prodCounts.set(p, (prodCounts.get(p) || 0) + 1)
      for (const r of ev.reactions || []) reactCounts.set(r, (reactCounts.get(r) || 0) + 1)
    }
    const topProducts = [...prodCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topReactions = [...reactCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { total, topProducts, topReactions }
  }, [filtered])

  function chip(status: typeof apiStatus) {
    if (status === "live") return "bg-green-100 text-green-700"
    if (status === "fallback") return "bg-yellow-100 text-yellow-700"
    if (status === "error") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  function exportCSV() {
    const rows = [
      ["id", "date", "products", "reactions", "reporter", "source"],
      ...filtered.map(ev => [
        ev.id,
        ev.date,
        (ev.products || []).join("|"),
        (ev.reactions || []).join("|"),
        ev.reporter || "",
        ev.source || ""
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `adverse_events_${monthsBack}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600">
            <span>FDA openFDA · CAERS</span>
            <span className={`rounded-full px-2 py-0.5 ${chip(apiStatus)}`}>{apiStatus}</span>
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">Adverse events</h1>
          <p className="mt-3 text-gray-600">
            Consumer adverse event reports related to foods and dietary supplements. Filter by product or reaction
            and export to CSV. Data from the FDA openFDA CAERS dataset.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setMonthsBack(3)} className={`btn ${monthsBack === 3 ? "btn-primary" : "btn-outline"}`}>3 mo</button>
            <button onClick={() => setMonthsBack(6)} className={`btn ${monthsBack === 6 ? "btn-primary" : "btn-outline"}`}>6 mo</button>
            <button onClick={() => setMonthsBack(12)} className={`btn ${monthsBack === 12 ? "btn-primary" : "btn-outline"}`}>12 mo</button>
            <button onClick={exportCSV} className="btn btn-outline">Export CSV</button>
            <CopyLink />
          </div>
        </header>

        {/* Filters */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <label className="block text-sm text-gray-600">Filter by product</label>
            <input
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="e.g., peanut butter"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>
          <div className="card p-4">
            <label className="block text-sm text-gray-600">Filter by reaction</label>
            <input
              value={searchReaction}
              onChange={(e) => setSearchReaction(e.target.value)}
              placeholder="e.g., nausea"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <div className="text-sm text-gray-600">Events (last {monthsBack} months)</div>
            <div className="mt-1 text-3xl font-bold">{kpi.total}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600">Top products</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {kpi.topProducts.length === 0 ? (
                <div className="text-sm text-gray-500">—</div>
              ) : kpi.topProducts.map(([name, count]) => (
                <span key={name} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {name} · {count}
                </span>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600">Top reactions</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {kpi.topReactions.length === 0 ? (
                <div className="text-sm text-gray-500">—</div>
              ) : kpi.topReactions.map(([name, count]) => (
                <span key={name} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {name} · {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="mt-8 card p-6">
          <div className="font-semibold">Recent events</div>
          {loading ? (
            <div className="mt-4 text-sm text-gray-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="mt-4 text-sm text-gray-600">No events found for the current filters.</div>
          ) : (
            <div className="mt-4 divide-y">
              {[...filtered]
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .slice(0, 50)
                .map((ev) => (
                  <div key={ev.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString()}</div>
                      <div className="text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-700">{ev.source || "openFDA CAERS"}</div>
                    </div>
                    <div className="mt-1 font-medium">
                      {(ev.products && ev.products.length > 0) ? ev.products.join(", ") : "Adverse event"}
                    </div>
                    {ev.reactions && ev.reactions.length > 0 && (
                      <div className="mt-1 text-sm text-gray-700">Reactions: {ev.reactions.join(", ")}</div>
                    )}
                    {ev.reporter && (
                      <div className="mt-1 text-xs text-gray-500">Reporter: {ev.reporter}</div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">id: {ev.id}</div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Notes: CAERS is a passive surveillance system. Reports are unverified and signals should be interpreted with caution.
        </p>
      </div>
    </section>
  )
}
