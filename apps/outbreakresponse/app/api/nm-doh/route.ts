import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

function normalizeItem(obj: any) {
  const keys = Object.keys(obj || {})
  const lc = (s: string) => s.toLowerCase()
  const pick = (cands: string[]) => {
    for (const k of cands) {
      const m = keys.find(x => lc(x) === lc(k))
      if (m) return obj[m]
    }
    return undefined
  }
  const date = pick(["date","report_date","sample_date","collection_date","as_of_date","week_start","submission_date"])
  const title = pick(["title","name","subject","event","headline","description","product","summary"])
  const link = pick(["link","url","href","source_url"])
  return { date: date ? String(date) : "", title: title ? String(title) : "", link: link ? String(link) : "" }
}

function parseCSV(text: string) {
  const rows: string[][] = []; let cur = ""; let row: string[] = []; let inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') { if (inQ && text[i+1] === '"') { cur += '"'; i++ } else { inQ = !inQ } }
    else if (ch === ',' && !inQ) { row.push(cur); cur = "" }
    else if ((ch === '\n' || ch === '\r') && !inQ) { if (cur.length || row.length) { row.push(cur); rows.push(row); row = []; cur = "" } if (ch === '\r' && text[i+1] === '\n') i++ }
    else { cur += ch }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row) }
  if (!rows.length) return []
  const header = rows[0].map(h => h.trim().toLowerCase())
  const out = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const obj: any = {}
    for (let c = 0; c < header.length; c++) obj[header[c]] = r[c] ?? ""
    out.push(normalizeItem(obj))
  }
  return out
}

export async function GET() {
  const jsonUrl = process.env.NM_DOH_JSON_URL
  const geoUrl  = process.env.NM_DOH_GEOJSON_URL
  const csvUrl  = process.env.NM_DOH_CSV_URL
  try {
    if (jsonUrl) {
      const r = await fetch(jsonUrl, { next: { revalidate: 3600 } })
      if (!r.ok) throw new Error(String(r.status))
      const j = await r.json()
      const arr = Array.isArray(j) ? j : Array.isArray((j as any).data) ? (j as any).data : Array.isArray((j as any).items) ? (j as any).items : []
      const data = arr.map(normalizeItem)
      return NextResponse.json({ data, fetchedAt: new Date().toISOString() })
    }
    if (geoUrl) {
      const r = await fetch(geoUrl, { next: { revalidate: 3600 } })
      if (!r.ok) throw new Error(String(r.status))
      const g = await r.json() as any
      const feats = Array.isArray(g?.features) ? g.features : []
      const data = feats.map((f: any) => normalizeItem(f?.properties || {}))
      return NextResponse.json({ data, fetchedAt: new Date().toISOString() })
    }
    if (csvUrl) {
      const r = await fetch(csvUrl, { next: { revalidate: 3600 } })
      if (!r.ok) throw new Error(String(r.status))
      const t = await r.text()
      const data = parseCSV(t)
      return NextResponse.json({ data, fetchedAt: new Date().toISOString() })
    }
  } catch {}

  try {
    const p = path.join(process.cwd(), "public", "nm-doh.json")
    const txt = await fs.readFile(p, "utf-8")
    const arr = JSON.parse(txt)
    const data = Array.isArray(arr) ? arr.map(normalizeItem) : []
    return NextResponse.json({ data, note: "Loaded from public/nm-doh.json", fetchedAt: new Date().toISOString() })
  } catch {}

  return NextResponse.json({ data: [], note: "Set NM_DOH_JSON_URL or NM_DOH_GEOJSON_URL or NM_DOH_CSV_URL, or add public/nm-doh.json", fetchedAt: new Date().toISOString() })
}
