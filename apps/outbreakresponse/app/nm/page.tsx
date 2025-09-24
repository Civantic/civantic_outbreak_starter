"use client"

import { useEffect, useMemo, useState } from "react"

type Outbreak = { id: string; date: string; state: string; etiology: string; illnesses: number; hospitalizations: number; deaths?: number; source: string }
type Recall = { id: string; date: string; stateScope: string[]; product: string; reason: string; source: string }
type Curated = { date?: string; title?: string; link?: string }

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` }
function addMonths(d: Date, m: number) { const dt = new Date(d); dt.setMonth(d.getMonth() + m); return dt }

// simple URL validator: https? and not example.com
function isValidCuratedLink(url?: string) {
  if (!url) return false
  const u = String(url).trim()
  if (!/^https?:\/\//i.test(u)) return false
  if (/\/\/(www\.)?example\.com/i.test(u)) return false
  return true
}

export default function NMPage() {
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([])
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [curated, setCurated] = useState<Curated[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const ob = await fetch(`/api/outbreaks?scope=NM&months=${monthsBack}`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] }))
      const rc = await fetch(`/api/recalls?scope=NM&months=${monthsBack}`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] }))
      const mh = await fetch(`/api/nm-doh`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] }))
      if (!cancelled) {
        setOutbreaks(ob.data || [])
        setRecalls(rc.data || [])
        setCurated(mh.data || [])
      }
    }
    load()
    return () => { cancelled = true }
  }, [monthsBack])

  const months = useMemo(() => {
    const now = new Date()
    const arr = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const x = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -i)
      arr.push({ key: monthKey(x), label: x.toLocaleString("en-US", { month: "short" }) })
    }
    return arr
  }, [monthsBack])

  const kpi = useMemo(() => {
    const obCount = outbreaks.length
    const ill = outbreaks.reduce((a, b) => a + (b.illnesses || 0), 0)
    const hosp = outbreaks.reduce((a, b) => a + (b.hospitalizations || 0), 0)
    const rcCount = recalls.length
    return { obCount, ill, hosp, rcCount }
  }, [outbreaks, recalls])

  const seriesOutbreaks = useMemo(() => {
    const map = new Map(months.map(m => [m.key, 0]))
    outbreaks.forEach(o => {
      const dt = new Date(o.date)
      const k = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1))
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1)
    })
    return months.map(m => ({ label: m.label, value: map.get(m.key) || 0 }))
  }, [outbreaks, months])

  function downloadCSV() {
    const rows = [
      ["date","state","etiology","illnesses","hospitalizations","deaths","source"],
      ...outbreaks.map(o => [o.date, o.state, o.etiology, String(o.illnesses||0), String(o.hospitalizations||0), String(o.deaths||0), o.source])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nm_outbreaks_${monthsBack}m.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600">
            <span>New Mexico overview</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">NM outbreaks and hospitalizations</h1>
          <p className="mt-4 text-lg text-gray-600">Recent outbreaks, hospitalizations, recalls, and curated updates in New Mexico.</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <button onClick={() => setMonthsBack(3)} className={`btn ${monthsBack === 3 ? "btn-primary" : "btn-outline"}`}>3 mo</button>
            <button onClick={() => setMonthsBack(6)} className={`btn ${monthsBack === 6 ? "btn-primary" : "btn-outline"}`}>6 mo</button>
            <button onClick={() => setMonthsBack(12)} className={`btn ${monthsBack === 12 ? "btn-primary" : "btn-outline"}`}>12 mo</button>
            <button onClick={downloadCSV} className="btn btn-outline">Export CSV</button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
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
            <div className="text-sm text-gray-600">Illnesses</div>
            <div className="mt-1 text-3xl font-bold">{kpi.ill}</div>
            <div className="mt-2 text-xs text-gray-500">From reported outbreaks</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600">Hospitalizations</div>
            <div className="mt-1 text-3xl font-bold">{kpi.hosp}</div>
            <div className="mt-2 text-xs text-gray-500">From reported outbreaks</div>
          </div>
          <div className="card p-6">
            <div className="text-sm text-gray-600">Recalls affecting NM</div>
            <div className="mt-1 text-3xl font-bold">{kpi.rcCount}</div>
            <div className="mt-2 text-xs text-gray-500">Includes nationwide recalls</div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="font-semibold">Curated NM DOH updates</div>
            <div className="mt-3 space-y-3">
              {curated.length === 0 ? (
                <div className="text-sm text-gray-600">No curated updates yet.</div>
              ) : curated.map((c, i) => {
                  const link = String(c.link || "")
                  const valid = isValidCuratedLink(link)
                  return (
                    <div key={i}>
                      <div className="text-sm text-gray-500">{c.date ? new Date(c.date).toLocaleDateString() : ""}</div>
                      <div className="font-medium">
                        {valid ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                            {c.title || link}
                          </a>
                        ) : (
                          <span>{c.title || (link ? "Update" : "")}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
          <div className="card p-6">
            <div className="font-semibold">Recent recalls</div>
            <div className="mt-3 divide-y">
              {[...recalls].sort((a,b)=>+new Date(b.date)-+new Date(a.date)).slice(0,6).map(r => (
                <div key={r.id} className="py-3">
                  <div className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()} · {r.stateScope.join(", ")}</div>
                  <div className="font-medium">{r.product}</div>
                  <div className="text-sm text-gray-700">{r.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 card p-6">
          <div className="font-semibold">Notes</div>
          <p className="mt-2 text-sm text-gray-700">Counts reflect public summaries and may lag official updates. Nationwide recalls are counted if they include NM. Curated items are entered manually for v1.</p>
        </div>
      </section>
    </div>
  )
}
