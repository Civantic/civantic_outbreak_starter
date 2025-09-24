"use client"

import { useEffect, useMemo, useState } from "react"
import CopyLink from "../../components/CopyLink"
import { productCategory } from "../../lib/productCat"

type Rec = { id:string; date:string; stateScope:string[]; product?:string; reason?:string; classification?:string; source:string }
type Enf = { id:string; date:string; product:string; reason:string; classification:string; center:string; firm?:string; distribution?:string; source?:string }
type DDRow = Record<string, any>

const STATES = ["ALL","AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

export default function RecallsPage() {
  const [scope, setScope] = useState<"US"|"NM">("US")
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [recallClass, setRecallClass] = useState<string>("")
  const [productQ, setProductQ] = useState<string>("")
  const [stateFilter, setStateFilter] = useState<string>("ALL")

  const [fda, setFDA] = useState<Rec[]>([])
  const [fsis, setFSIS] = useState<Rec[]>([])
  const [enf, setENF] = useState<Enf[]>([])
  const [enfStatus, setEnfStatus] = useState<"loading"|"live"|"fallback"|"error">("loading")

  const [ddRows, setDDRows] = useState<DDRow[]>([])
  const [ddStatus, setDDStatus] = useState<"loading"|"live"|"error">("loading")

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    async function load(){
      setLoading(true)

      const params = new URLSearchParams()
      params.set("scope", scope)
      params.set("months", String(monthsBack))
      if (recallClass) params.set("class", recallClass)
      if (productQ) params.set("product_q", productQ)
      if (stateFilter !== "ALL") params.set("state", stateFilter)

      const classesParam = recallClass ? recallClass.replace(/\s+/g,"").split(",").map(s => s.replace("class","")).join(",") : "1,2,3,NC"

      try {
        const [rfda, rfsis, renf] = await Promise.all([
          fetch(`/api/recalls?${params.toString()}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({ data: [] })),
          fetch(`/api/fsis?scope=${scope}&months=${monthsBack}`, { cache:"no-store" }).then(r=>r.json()).catch(()=>({ data: [] })),
          fetch(`/api/fda-enforcement?months=${monthsBack}&classes=${encodeURIComponent(classesParam)}&center=CFSAN`, { cache:"no-store" })
            .then(async r => {
              const j = await r.json().catch(()=>({ data:[], error:true }))
              return { ok: r.ok, body: j }
            })
            .catch(() => ({ ok:false, body:{ data:[], error:true }}))
        ])

        if (cancel) return

        const fdaRows: Rec[] = (rfda.data||[]).map((x:any)=>({ id:x.id, date:x.date, stateScope:x.stateScope||[], product:x.product||"", reason:x.reason||"", classification:x.classification||"", source:"FDA" }))
        let fsisRows: Rec[] = (rfsis.data||[]).map((x:any)=>({ id:x.id, date:x.date, stateScope:(x.stateScope||[]), product:x.product||"", reason:x.reason||"", classification:undefined, source:"FSIS" }))
        if (recallClass) {
          const rx = new RegExp(recallClass.replace(/\s+/g,"\\s*"), "i")
          fsisRows = fsisRows.filter(r => rx.test(r.reason || ""))
        }
        if (productQ) fsisRows = fsisRows.filter(r => (r.product||"").toLowerCase().includes(productQ.toLowerCase()))
        if (stateFilter !== "ALL") fsisRows = fsisRows.filter(r => r.stateScope.includes(stateFilter) || r.stateScope.length > 40)

        setFDA(fdaRows)
        setFSIS(fsisRows)

        const enfBody = renf.body || {}
        const enfRows: Enf[] = (enfBody.data||[]).map((x:any)=>({
          id: String(x.id || x.recalleventid || x.recallnum || crypto.randomUUID()),
          date: String(x.date||"").slice(0,10),
          product: String(x.product||""),
          reason: String(x.reason||""),
          classification: String(x.classification||""),
          center: String(x.center||""),
          firm: String(x.firm||""),
          distribution: String(x.distribution||""),
          source: "FDA IRES"
        }))
        setENF(enfRows)
        setEnfStatus(enfBody.error ? "error" : enfBody.fallback ? "fallback" : renf.ok ? "live" : "error")

      } catch {
        if (!cancel) {
          setENF([])
          setEnfStatus("error")
        }
      }

      try {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        from.setMonth(from.getMonth() - monthsBack + 1)
        const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

        const ddBody = {
          start: 1,
          rows: 6,
          sort: "RefusalDate",
          sortorder: "DESC",
          filters: {
            RefusalDateFrom: [ymd(from)],
            RefusalDateTo: [ymd(now)]
          },
          columns: ["RefusalDate","FirmName","CountryName","ProductCode","FEINumber"]
        }

        const ddRes = await fetch("/api/dd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: "import_refusals", body: ddBody })
        })
        const ddJson = await ddRes.json()
        if (!cancel) {
          if (ddRes.ok && Array.isArray(ddJson.data)) {
            setDDRows(ddJson.data)
            setDDStatus("live")
          } else {
            setDDRows([])
            setDDStatus("error")
          }
        }
      } catch {
        if (!cancel) {
          setDDRows([])
          setDDStatus("error")
        }
      }

      if (!cancel) setLoading(false)
    }
    load()
    return () => { cancel = true }
  }, [scope, monthsBack, recallClass, productQ, stateFilter])

  const all = useMemo(() => {
    const rows = [...fda, ...fsis]
    return rows.sort((a,b)=>+new Date(b.date)-+new Date(a.date))
  }, [fda, fsis])

  function exportCSV() {
    const rows = [["date","source","classification","states","product","reason","id"],
      ...all.map(r => [r.date, r.source, r.classification||"", (r.stateScope||[]).join("|"), r.product||"", r.reason||"", r.id])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `recalls_${scope}_${monthsBack}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportENF() {
    const rows = [["date","classification","center","firm","product","reason","distribution","id"],
      ...enf.map(e => [e.date, e.classification||"", e.center||"", e.firm||"", e.product||"", e.reason||"", e.distribution||"", e.id])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `fda_enforcement_${monthsBack}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportDD() {
    const rows = [["RefusalDate","FirmName","CountryName","ProductCode","FEINumber"],
      ...ddRows.map(r => [r.RefusalDate||"", r.FirmName||"", r.CountryName||"", r.ProductCode||"", r.FEINumber||""])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `import_refusals_${monthsBack}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function chip(c:"loading"|"live"|"fallback"|"error"){
    if (c==="live") return "bg-green-100 text-green-700"
    if (c==="fallback") return "bg-yellow-100 text-yellow-700"
    if (c==="error") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Food safety recalls</h1>
          <p className="mt-2 text-gray-600">FDA and FSIS recalls, plus FDA Enforcement (IRES) and Import Refusals (Data Dashboard).</p>
        </div>

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

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({length:6}).map((_,i)=><div key={i} className="card p-6 h-36 animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...fda, ...fsis].sort((a,b)=>+new Date(b.date)-+new Date(a.date)).map(r => (
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

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">FDA Enforcement (IRES)</div>
                  <div className={`text-xs rounded-full px-2 py-1 ${enfStatus==="live"?"bg-green-100 text-green-700":enfStatus==="fallback"?"bg-yellow-100 text-yellow-700":enfStatus==="error"?"bg-red-100 text-red-700":"bg-gray-100 text-gray-700"}`}>IRES {enfStatus}</div>
                </div>
                {enf.length === 0 ? (
                  <div className="mt-3 text-sm text-gray-700">No enforcement items in this window.</div>
                ) : (
                  <>
                    <div className="mt-3 divide-y">
                      {enf.slice(0,6).map(e=>(
                        <div key={e.id} className="py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-500">{e.date ? new Date(e.date).toLocaleDateString() : "—"}</div>
                            <div className="flex items-center gap-2">
                              {e.classification ? <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">{e.classification}</span> : null}
                              <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">IRES</span>
                            </div>
                          </div>
                          <div className="mt-1 font-medium">{e.product || "Enforcement"}</div>
                          <div className="text-gray-700">{e.reason || ""}</div>
                          <div className="text-xs text-gray-500 mt-1">{e.firm || ""}</div>
                          {e.distribution ? <div className="text-xs text-gray-500 mt-1">Distribution: {e.distribution}</div> : null}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <button onClick={exportENF} className="btn btn-outline">Export FDA Enforcement CSV</button>
                    </div>
                  </>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Import Refusals (FDA Data Dashboard)</div>
                  <div className={`text-xs rounded-full px-2 py-1 ${ddStatus==="live"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>DD {ddStatus}</div>
                </div>
                {ddRows.length === 0 ? (
                  <div className="mt-3 text-sm text-gray-700">No refusals returned. If this persists, check endpoint/fields in your FDA DD account.</div>
                ) : (
                  <>
                    <div className="mt-3 divide-y">
                      {ddRows.map((r, i)=>(
                        <div key={`${r.ShipmentID||r.FEINumber||i}-${i}`} className="py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-500">{r.RefusalDate ? new Date(r.RefusalDate).toLocaleDateString() : "—"}</div>
                            <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">DD</span>
                          </div>
                          <div className="mt-1 font-medium">{r.FirmName || "Firm"}</div>
                          <div className="text-gray-700">{r.ProductCode || ""}</div>
                          <div className="text-xs text-gray-500">{r.CountryName || ""}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <button onClick={exportDD} className="btn btn-outline">Export Import Refusals CSV</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
