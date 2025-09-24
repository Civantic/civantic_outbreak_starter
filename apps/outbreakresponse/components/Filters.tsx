"use client"

import { useEffect, useState } from "react"

type Props = {
  onChange: (f: { etiology: string; recallClass: string; productQ: string }) => void
  initial?: { etiology?: string; recallClass?: string; productQ?: string }
}

export default function Filters({ onChange, initial }: Props) {
  const [etiology, setEtiology] = useState(initial?.etiology ?? "")
  const [recallClass, setRecallClass] = useState(initial?.recallClass ?? "")
  const [productQ, setProductQ] = useState(initial?.productQ ?? "")

  useEffect(() => {
    onChange({ etiology, recallClass, productQ })
  }, [etiology, recallClass, productQ, onChange])

  return (
    <div className="card p-2 flex flex-wrap items-center gap-2">
      <input
        value={etiology}
        onChange={(e) => setEtiology(e.target.value)}
        placeholder="Pathogen (e.g., listeria)"
        className="rounded-md border px-3 py-2 text-sm"
      />
      <select
        value={recallClass}
        onChange={(e) => setRecallClass(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Recall class</option>
        <option value="class i">Class I</option>
        <option value="class ii">Class II</option>
        <option value="class iii">Class III</option>
      </select>
      <input
        value={productQ}
        onChange={(e) => setProductQ(e.target.value)}
        placeholder="Product contains…"
        className="rounded-md border px-3 py-2 text-sm"
      />
    </div>
  )
}
