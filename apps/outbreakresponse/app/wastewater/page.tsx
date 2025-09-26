"use client"

import { useEffect, useMemo, useState } from "react"
import CopyLink from "../../components/CopyLink"
import { productCategory } from "../../lib/productCat"

type Recall = {
  id: string
  date: string
  stateScope: string[]
  product: string
  reason: string
  classification?: string
  source: string
}

type ImportRefusal = {
  id: string
  date: string
  product: string
  country?: string
  reason?: string
  firm?: string
  code?: string
}

type FeedStatus = "loading" | "live" | "fallback" | "error"

const STATES = [
  "ALL","AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND",
  "OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
]

export default function RecallsPage() {
  const [scope, setScope] = useState<"US"|"NM">("US")
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [recallClass, setRecallClass] = useState<string>("")
  const [productQ, setProductQ] = useState<string>("")
  const [stateFilter, setStateFilter] = useState<string>("ALL")

  const [fda, setFDA] = useState<Recall[]>([])
  const [fsis, setFSIS] = useState<Recall[]>([])
  const [dd, setDD] = useState<ImportRefusal[]>([])

  const [statusFDA, setStatusFDA] = useState<FeedStatus>("loading")
  const [statusFSIS, setStatusFSIS] = useState<FeedStatus>("loading")
  const [statusDD, setStatusDD] = useState<FeedStatus>("loading")

  const [detailFDA, setDetailFDA] = useState<string>("")
  const [detailFSIS, setDetailFSIS] = useState<string>("")
  const [detailDD, setDetailDD] = useState<string>("")

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      setStatusFDA("loading"); setStatusFSIS("loading"); setStatusDD("loading")
      setDetailFDA(""); setDetailFSIS(""); setDetailDD("")

      // Build query for FDA recalls (openFDA)
      const qsFDA = new URLSearchParams()
      qsFDA.set("scope", scope)
      qsFDA.set("months", String(monthsBack))
      if (recallClass) qsFDA.set("class", recallClass)
      if (productQ) qsFDA.set("product_q", productQ)
      if (stateFilter !== "ALL") qsFDA.set("state", stateFilter)

      try {
        const r1 = await fetch(`/api/recalls?${qsFDA.toString()}`)
        const j1 = await r1.json().catch(()=>({}))
        if (!cancel) {
          const rows: Recall[] = Array.isArray(j1?.data) ? j1.data : []
          setFDA(rows)
          const st: FeedStatus = j1?.error ? "error" : j1?.fallback ? "fallback" : r1.ok ? "live" : "error"
          setStatusFDA(st)
          setDetailFDA(j1?.errorDetail || "")
        }
      } catch (e:any) {
        if (!cancel) { setFDA([]); setStatusFDA("error"); setDetailFDA(String(e?.message||e)) }
      }

      // FSIS recalls
      try {
        const r2 = await fetch(`/api/fsis?scope=${scope}&months=${monthsBack}`)
        const j2 = await r2.json().catch(()=>({}))
        if (!cancel) {
          let rows: Recall[] = Array.isArray(j2?.data) ? j2.data : []
          // Optional client filter for "class" by scanning reason text
          if (recallClass) {
            const rx = new RegExp(recallClass.replace(/\s+/g,"\\s*"), "i")
            rows = rows.filter(x => rx.test(x.reason||""))
          }
          // Optional client filter for productQ
          if (productQ) rows = rows.filter(x => (x.product||"").toLowerCase().includes(productQ.toLowerCase()))
          // Optional client filter for state
          if (stateFilter !== "ALL") rows = rows.filter(x => x.stateScope.includes(stateFilter) || x.stateScope.length > 40)
          setFSIS(rows)
          const st: FeedStatus = j2?.error ? "error" : j2?.fallback ? "fallback" : r2.ok ? "live" : "error"
          setStatusFSIS(st)
          setDetailFSIS(j2?.errorDetail || "")
        }
      } catch (e:any) {
        if (!cancel) { setFSIS([]); setStatusFSIS("error"); setDetailFSIS(String(e?.message||e)) }
      }

      // FDA Data Dashboard (Import Refusals) – optional, shows if configured
      try {
        const r3 = await fetch(`/api/import-refusals?months=${monthsBack}`)
        const j3 = await r3.json().catch(()=>({}))
        if (!cancel) {
          const rows: ImportRefusal[] = Array.isArray(j3?.data) ? j3.data : []
          setDD(rows.slice(0, 8)) // small sample
          const st: FeedStatus = j3?.error ? "error" : j3?.fallback ? "fallback" : r3.ok ? "live" : "error"
          setStatusDD(st)
          setDetailDD(j3?.errorDetail || "")
        }
      } catch (e:any) {
        if (!cancel) { setDD([]); setStatusDD("error"); setDetailDD(String(e?.message||e)) }
      }

      if (!cancel) setLoading(false)
    }
    load()
    return () => { cancel = true }
  }, [scope, monthsBack, recallClass, productQ, stateFilter])

  const allRecalls = useMemo(() => {
    const rows = [...fda, ...fsis]
    return rows.sort((a,b)=>+new Date(b.date)-+new Date(a.date))
  }, [fda, fsis])

  function chip(c:FeedStatus){
    if (c==="live") return "bg-green-100 text-green-700"
    if (c==="fallback") return "bg-yellow-100 text-yellow-700"
    if (c==="error") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  function exportCSV() {
    const rows = [
      ["date","source","classification","states","product","reason","id"],
      ...allRecalls.map(r => [
        r.date,
        r.source,
        r.classification||"",
        (r.stateScope||[]).join("|"),
        r.product||"",
        r.reason||"",
        r.id
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `recalls_${scope}_${monthsBack}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Food safety recalls</h1>
          <p className="mt-2 text-gray-600">FDA (openFDA) and USDA-FSIS recalls, plus Import Refusals (FDA Data Dashboard).</p>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="card p-2">
            <button onClick={()=>setScope("US")} className={`btn ${scope==="US"?"btn-primary":"btn-outline"}`}>United States</button>
            <button onClick={()=>setScope("NM")} className={`btn ${scope==="NM"?"btn-primary":"btn-outline"}`}>New Mexico</button>
          </div>
          <div className="card p-2">
            <button onClick={()=>setMonthsBack(3)} className={`btn ${monthsBack===3?"btn-primary":"btn-outline"}`}>3 mo</button>
            <button onClick={()=>setMonthsBack(6)} className={`btn ${monthsBack===6?"btn-primary":"btn-outline"}`}>6 mo</button>
            <button onClick={()=>setMonthsBack(12)} className={`btn ${monthsBack===12?"btn-primary":"btn-outline"}`}>12 mo</button>
          </div>
          <div className="card p-2 flex flex-wrap items-center gap-2">
            <select value={recallClass} onChange={e=>setRecallClass(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              <option value="">Class (all)</option>
              <option value="class i">Class I</option>
              <option value="class ii">Class II</option>
              <option value="class iii">Class III</option>
            </select>
            <input value={productQ} onChange={e=>setProductQ(e.target.value)} placeholder="Product contains…" className="rounded-md border px-3 py-2 text-sm" />
            <select value={stateFilter} onChange={e=>setStateFilter(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
              {STATES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={exportCSV} className="btn btn-outline">Export CSV</button>
          <CopyLink />
        </div>

        {/* Feed status */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-3 py-1 ${chip(statusFDA)}`}>FDA openFDA {statusFDA}</span>
          <span className={`rounded-full px-3 py-1 ${chip(statusFSIS)}`}>USDA FSIS {statusFSIS}</span>
          <span className={`rounded-full px-3 py-1 ${chip(statusDD)}`}>Import Refusals {statusDD}</span>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length:6}).map((_,i)=><div key={i} className="card p-6 h-36 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Recalls cards */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allRecalls.map(r => (
                <div key={r.id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2">
                      {r.classification ? <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">{r.classification}</span> : null}
                      <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">{r.source}</span>
                    </div>
                  </div>
                  <div className="mt-1 font-semibold">{r.product || "Recall"}</div>
                  <div className="mt-1 text-xs inline-flex items-center gap-1">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">{productCategory(r.product)}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 line-clamp-3">{r.reason || ""}</div>
                  <div className="mt-3 text-xs text-gray-500">States: {(r.stateScope||[]).join(", ") || "—"}</div>
                </div>
              ))}
            </div>

            {/* Error details if any feed failed */}
            {(detailFDA || detailFSIS || detailDD) ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {detailFDA ? <div className="card p-4"><div className="font-semibold">FDA openFDA error</div><pre className="mt-2 text-xs whitespace-pre-wrap text-red-700 bg-red-50 p-2 rounded">{detailFDA}</pre></div> : null}
                {detailFSIS ? <div className="card p-4"><div className="font-semibold">USDA FSIS error</div><pre className="mt-2 text-xs whitespace-pre-wrap text-red-700 bg-red-50 p-2 rounded">{detailFSIS}</pre></div> : null}
                {detailDD ? <div className="card p-4"><div className="font-semibold">Import Refusals error</div><pre className="mt-2 text-xs whitespace-pre-wrap text-red-700 bg-red-50 p-2 rounded">{detailDD}</pre></div> : null}
              </div>
            ) : null}

            {/* Import Refusals mini list */}
            <div className="mt-8 card p-6">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Import Refusals (FDA Data Dashboard)</div>
                <span className={`text-xs rounded-full px-2 py-1 ${chip(statusDD)}`}>{statusDD}</span>
              </div>
              {dd.length === 0 ? (
                <div className="mt-2 text-sm text-gray-600">No import refusals in this window or not authorized.</div>
              ) : (
                <div className="mt-3 divide-y text-sm">
                  {dd.map((r)=>(
                    <div key={r.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</div>
                        <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">DD</span>
                      </div>
                      <div className="font-medium">{r.product || "Product"}</div>
                      <div className="text-gray-700">{r.reason || ""}</div>
                      <div className="text-xs text-gray-500">{r.country || ""} {r.firm ? `• ${r.firm}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
