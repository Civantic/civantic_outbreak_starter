// apps/outbreakresponse/app/wastewater/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Pt = { date: string; value: number; detected?: boolean }
type Resp = { series: Pt[]; latest?: number; detectionRate14d?: number; fallback?: boolean }

export default function WastewaterPage() {
  const [monthsBack, setMonthsBack] = useState<number>(6)
  const [state, setState] = useState<string>("US") // future: allow specific state site filters
  const [data, setData] = useState<Resp>({ series: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        qs.set("months", String(monthsBack))
        if (state && state !== "US") qs.set("state", state)
        const r = await fetch(`/api/wastewater?${qs.toString()}`, { cache: "no-store" })
        const j = (await r.json()) as Resp
        if (!cancel) setData(j)
      } catch {
        if (!cancel) setData({ series: [] })
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => {
      cancel = true
    }
  }, [monthsBack, state])

  // Simple bar heights for last 12 samples
  const bars = useMemo(() => {
    const s = [...(data.series || [])].slice(-12)
    const max = Math.max(1, ...s.map((p) => p.value || 0))
    return s.map((p) => ({ date: p.date, h: 4 + Math.round(((p.value || 0) / max) * 36), detected: !!p.detected }))
  }, [data.series])

  const det = data.detectionRate14d ?? 0
  const latest = Math.round(data.latest || 0)

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Wastewater signal</h1>
        <p className="mt-3 text-gray-600">
          Percentile trend and a “recent detection rate” based on the share of recent samples with a
          detectable signal. This helps indicate whether infections are broadly detectable in the wastewater.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={() => setMonthsBack(3)} className={`btn ${monthsBack === 3 ? "btn-primary" : "btn-outline"}`}>3 mo</button>
          <button onClick={() => setMonthsBack(6)} className={`btn ${monthsBack === 6 ? "btn-primary" : "btn-outline"}`}>6 mo</button>
          <button onClick={() => setMonthsBack(12)} className={`btn ${monthsBack === 12 ? "btn-primary" : "btn-outline"}`}>12 mo</button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <div className="text-sm text-gray-600">Latest percentile</div>
            <div className="mt-1 text-3xl font-bold">{latest}</div>
            <div className="mt-4 h-16 flex items-end gap-1">
              {bars.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded"
                  title={`${b.date} · ${b.h} · ${b.detected ? "detected" : "not detected"}`}
                  style={{
                    backgroundColor: b.detected ? "rgba(61,115,255,0.9)" : "rgba(61,115,255,0.3)",
                    height: `${b.h}px`,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">Recent samples (last 12)</div>
          </div>

          <div className="card p-6">
            <div className="text-sm text-gray-600">Detection rate (last 14 samples)</div>
            <div className="mt-1 text-3xl font-bold">{det}%</div>
            <p className="mt-3 text-sm text-gray-600">
              **Detection rate** is the percent of recent samples with a detectable signal. When this is high and sustained,
              it suggests infection is broadly present in the sewershed. Percentile contextualizes how today compares to that site’s past.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 card p-6">Loading…</div>
        ) : data.series && data.series.length === 0 ? (
          <div className="mt-8 card p-6 text-sm text-gray-700">No wastewater data for this selection.</div>
        ) : null}
      </div>
    </section>
  )
}
