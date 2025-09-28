// apps/outbreakresponse/app/nm/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"

type Outbreak = { id: string; date: string; state: string; etiology: string; illnesses: number; hospitalizations: number; deaths?: number; source: string }
type Recall = { id: string; date: string; stateScope: string[]; product: string; reason: string; source: string }
type Event = { date?: string; title?: string; link?: string }
type DOHRow = { date: string; cases?: number; hospitalizations?: number; deaths?: number }
type DOHResp = { events: Event[]; timeseries: DOHRow[] }

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` }
function addMonths(d: Date, m: number) { const dt = new Date(d); dt.setMonth(d.getMonth() + m); return dt }

export default function NMPage() {
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([])
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [doh, setDoh] = useState<DOHRow[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [ob, rc, doh] = await Promise.all([
        fetch(`/api/outbreaks?scope=NM&months=${monthsBack}`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/recalls?scope=NM&months=${monthsBack}`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/nm-doh`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ events: [], timeseries: [] } as DOHResp)),
      ])
      if (!cancelled) {
        setOutbreaks(ob.data || [])
        setRecalls(rc.data || [])
        setEvents((doh.events || []).filter(Boolean))
        setDoh((doh.timeseries || []).filter(Boolean))
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

    // DOH last 30 days
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const doh30 = (doh || []).filter(r => new Date(r.date) >= cutoff)
    const dohCases30 = doh30.reduce((a, b) => a + (b.cases || 0), 0)
    const dohHosp30 = doh30.reduce((a, b) => a + (b.hospitalizations || 0), 0)

    return { obCount, ill, hosp, rcCount, dohCases30, dohHosp30 }
  }, [outbreaks, recalls, doh])

  const seriesOutbreaks = useMemo(() => {
    const map = new Map(months.map(m => [m.key, 0]))
    outbreaks.forEach(o => {
      const dt = new Date(o.date)
      const k = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1))
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1)
    })
    return months.map(m => ({ label: m.label, value: map.get(m.key) || 0 }))
  }, [outbreaks, months])

  return (
    <div>
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600">
            <span>New Mexico overview</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">NM outbreaks & DOH context</h1>
          <p className="mt-4 text-lg text-gray-600">
            Recent outbreaks, hospitalizations, recalls, and DOH timeseries for New Mexico.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <button onClick={() => setMonthsBack(3)} className={`btn ${monthsBack === 3 ? "btn-primary" : "btn-outline"}`}>3 mo</button>
            <button onClick={() => setMonthsBack(6)} className={`btn ${monthsBack === 6 ? "btn-primary" : "btn-outline"}`}>6 mo</button>
            <button onClick={() => setMonthsBack(12)} className={`btn ${monthsBack === 12 ? "btn-primary" : "btn-outline"}`}>12 mo</button>
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
            <div className="text-sm text-gray-600">DOH Cases (last 30d)</div>
            <div className="mt-1 text-3xl font-bold">{kpi.dohCases30}</div>
            <div className="mt-2 text-xs text-gray-500">Hospitalizations 30d: {kpi.dohHosp30}</div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="font-semibold">Curated NM DOH updates</div>
            <div className="mt-3 space-y-3">
              {events.length === 0 ? (
                <div className="text-sm text-gray-600">No curated updates yet.</div>
              ) : events.map((c, i) => (
                <div key={i}>
                  <div className="text-sm text-gray-500">{c.date ? new Date(c.date).toLocaleDateString() : ""}</div>
                  <div className="font-medium">
                    {c.link ? <a href={c.link} className="text-brand-700 hover:underline" target="_blank" rel="noreferrer">{c.title || c.link}</a> : (c.title || "")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="font-semibold">Recent recalls affecting NM</div>
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
          <p className="mt-2 text-sm text-gray-700">
            Counts reflect public summaries and may lag official updates. CSVs placed in <code>/public/nm-doh</code>
            are merged into DOH timeseries. Curated items come from <code>/public/nm-doh.json</code>.
          </p>
        </div>
      </section>
    </div>
  )
}
