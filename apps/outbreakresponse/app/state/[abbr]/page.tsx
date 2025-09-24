"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import CopyLink from "../../../components/CopyLink"
import { productCategory } from "../../../lib/productCat"

type Outbreak = { id:string; date:string; state:string; etiology?:string; illnesses?:number; hospitalizations?:number; deaths?:number; source?:string }
type Recall   = { id:string; date:string; stateScope:string[]; product?:string; reason?:string; source?:string }
type WWPoint  = { date:string; value:number }

export default function StatePage({ params }: { params: { abbr: string } }) {
  const router = useRouter()
  const abbr = params.abbr.toUpperCase()
  const q = useSearchParams()
  const qDomain = q.get("domain") === "foodSafety" ? "foodSafety" : "publicHealth"
  const qMonths = Math.max(1, Math.min(12, Number(q.get("months") || 6))) || 6

  const [domain, setDomain] = useState<"publicHealth" | "foodSafety">(qDomain)
  const [monthsBack, setMonthsBack] = useState<number>(qMonths)
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([])
  const [recallsFDA, setRecallsFDA] = useState<Recall[]>([])
  const [recallsFSIS, setRecallsFSIS] = useState<Recall[]>([])
  const [ww, setWw] = useState<WWPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    router.replace(`/state/${abbr}?domain=${domain}&months=${monthsBack}`)
  }, [abbr, domain, monthsBack, router])

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      try {
        const [ob, fda, fsis, w] = await Promise.all([
          fetch(`/api/outbreaks?scope=US&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`/api/recalls?scope=US&months=${monthsBack}`,   { cache: "no-store" }).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`/api/fsis?scope=US&months=${monthsBack}`,      { cache: "no-store" }).then(r=>r.json()).catch(()=>({data:[]})),
          fetch(`/api/wastewater?state=${abbr}&months=${monthsBack}`, { cache: "no-store" }).then(r=>r.json()).catch(()=>({series:[]}))
        ])
        if (!cancel) {
          const obRows = (ob.data||[]).map((x:any)=>({
            id:x.id, date:x.date, state:String(x.state||"").toUpperCase(),
            etiology:x.etiology||"Unknown", illnesses:Number(x.illnesses||0), hospitalizations:Number(x.hospitalizations||0),
            deaths:Number(x.deaths||0), source:x.source||"CDC NORS"
          })).filter((r:Outbreak)=>r.state===abbr)

          const fdaRows = (fda.data||[]).map((x:any)=>({
            id:x.id, date:x.date, stateScope:(x.stateScope||[]).map((s:string)=>String(s).toUpperCase()),
            product:x.product||"", reason:x.reason||"", source:x.source||"FDA openFDA"
          })).filter((r:Recall)=>r.stateScope.includes(abbr))

          const fsisRows = (fsis.data||[]).map((x:any)=>({
            id:x.id, date:x.date, stateScope:(x.stateScope||[]).map((s:string)=>String(s).toUpperCase()),
            product:x.product||"", reason:x.reason||"", source:x.source||"USDA-FSIS"
          })).filter((r:Recall)=>r.stateScope.includes(abbr))

          setOutbreaks(obRows)
          setRecallsFDA(fdaRows)
          setRecallsFSIS(fsisRows)
          setWw((w.series||[]).map((p:any)=>({ date:p.date, value:Number(p.value||0) })))
          setLoading(false)
        }
      } catch {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [abbr, monthsBack])

  const recallsAll = useMemo(() => [...recallsFDA, ...recallsFSIS], [recallsFDA, recallsFSIS])
  const recent = useMemo(() => {
    if (domain === "publicHealth") {
      return [...outbreaks].sort((a,b)=>+new Date(b.date)-+new Date(a.date)).slice(0, 20)
    } else {
      return [...recallsAll].sort((a,b)=>+new Date(b.date)-+new Date(a.date)).slice(0, 20)
    }
  }, [domain, outbreaks, recallsAll])

  const wwBars = useMemo(() => {
    const s = [...ww].sort((a,b)=>+new Date(a.date)-+new Date(b.date)).slice(-12)
    const max = Math.max(1, ...s.map(p=>p.value||0))
    return s.map(p => ({ h: 4 + Math.round((p.value||0)/max*36) }))
  }, [ww])

  const wwPct75 = ww.length ? Math.round((ww.filter(p=>p.value>=75).length/ww.length)*100) : 0

  function exportCSV() {
    if (domain === "publicHealth") {
      const rows = [["date","state","etiology","illnesses","hospitalizations","deaths","source","id"],
        ...outbreaks.map(r => [r.date, r.state, r.etiology||"", String(r.illnesses||0), String(r.hospitalizations||0), String(r.deaths||0), r.source||"", r.id])]
      const url = URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" }))
      const a = document.createElement("a"); a.href = url; a.download = `outbreaks_${abbr}_${monthsBack}m.csv`; a.click(); URL.revokeObjectURL(url)
    } else {
      const rows = [["date","states","product","reason","source","id"],
        ...recallsAll.map(r => [r.date, (r.stateScope||[]).join("|"), r.product||"", r.reason||"", r.source||"", r.id])]
      const url = URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" }))
      const a = document.createElement("a"); a.href = url; a.download = `recalls_${abbr}_${monthsBack}m.csv`; a.click(); URL.revokeObjectURL(url)
    }
  }

  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{abbr} overview</h1>
        <p className="mt-2 text-gray-600">Recent {domain === "publicHealth" ? "outbreaks" : "recalls"} in {abbr} (last {monthsBack} months).</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href="/map" className="btn btn-outline">Back to map</a>
          <button onClick={()=>setDomain("publicHealth")} className={`btn ${domain==="publicHealth"?"btn-primary":"btn-outline"}`}>Public health</button>
          <button onClick={()=>setDomain("foodSafety")} className={`btn ${domain==="foodSafety"?"btn-primary":"btn-outline"}`}>Food safety</button>
          <button onClick={()=>setMonthsBack(3)} className={`btn ${monthsBack===3?"btn-primary":"btn-outline"}`}>3 mo</button>
          <button onClick={()=>setMonthsBack(6)} className={`btn ${monthsBack===6?"btn-primary":"btn-outline"}`}>6 mo</button>
          <button onClick={()=>setMonthsBack(12)} className={`btn ${monthsBack===12?"btn-primary":"btn-outline"}`}>12 mo</button>
          <button onClick={exportCSV} className="btn btn-outline">Export CSV</button>
          <CopyLink />
        </div>

        {loading ? (
          <div className="mt-8 card p-6">Loading…</div>
        ) : (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <div className="font-semibold">Wastewater signal (last samples)</div>
                <div className="mt-3 h-16 flex items-end gap-1">
                  {wwBars.map((d,i)=><div key={i} className="flex-1 rounded bg-brand-200" style={{ height: `${d.h}px` }} />)}
                </div>
                <div className="mt-2 text-xs text-gray-500">{wwPct75}% of days ≥ 75th percentile</div>
              </div>

              <div className="card p-6">
                <div className="font-semibold">Recent {domain === "publicHealth" ? "outbreaks" : "recalls"}</div>
                <div className="mt-3 divide-y">
                  {recent.length===0 ? (
                    <div className="text-sm text-gray-500 py-3">No recent items for this selection.</div>
                  ) : domain==="publicHealth" ? recent.map(r=>(
                    <div key={r.id} className="py-3 text-sm">
                      <div className="text-gray-500">{new Date(r.date).toLocaleDateString()} · {r.state}</div>
                      <div className="font-medium">{r.etiology||"Outbreak"}</div>
                      <div className="text-gray-700">Illnesses {r.illnesses||0} · Hospitalizations {r.hospitalizations||0}{(r.deaths||0)>0?` · Deaths ${r.deaths}`:""}</div>
                    </div>
                  )) : recent.map((r:any)=>(
                    <div key={r.id} className="py-3 text-sm">
                      <div className="text-gray-500">{new Date(r.date).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.product||"Recall"}</span>
                        <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">{productCategory(r.product)}</span>
                      </div>
                      <div className="text-gray-700">{r.reason||""}</div>
                      <div className="text-gray-500 text-xs">States: {(r.stateScope||[]).join(", ")||"—"}</div>
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
