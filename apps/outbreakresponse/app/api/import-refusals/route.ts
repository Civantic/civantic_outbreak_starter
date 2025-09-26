export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"

type Row = {
  id: string
  date: string
  product: string
  country?: string
  reason?: string
  firm?: string
  code?: string
  source: "FDA-DD"
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

async function callDD(ep:string, authUser:string, authKey:string, months:number, rowsParam:number){
  const base = `https://api-datadashboard.fda.gov/v1/${ep}`
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  from.setMonth(from.getMonth() - months + 1)
  const body = {
    start: 1,
    rows: rowsParam,
    sort: "RefusalDate",
    sortorder: "DESC",
    filters: { RefusalDateFrom: [ymd(from)], RefusalDateTo: [ymd(now)] },
    columns: ["RefusalDate","FirmName","CountryName","ProductCode","FEINumber","RefusalCharges"]
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization-User": authUser,
    "Authorization-Key": authKey,
    "User-Agent": "OutbreakResponse/1.0"
  }
  const r = await fetch(base, { method: "POST", headers, body: JSON.stringify(body), next: { revalidate: 300 } })
  const text = await r.text()
  let j:any; try { j = JSON.parse(text) } catch { j = { statuscode: r.status, message: "Non-JSON response", raw: text.slice(0,800) } }
  return { ok: r.ok, j, status: r.status }
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const months = Math.max(1, Math.min(24, Number(u.searchParams.get("months") || 6)))
  const rowsParam = Math.max(1, Math.min(5000, Number(u.searchParams.get("rows") || 200)))

  const authUser = process.env.FDA_DD_AUTH_USER || ""
  const authKey  = process.env.FDA_DD_AUTH_KEY || ""
  let endpoint   = (process.env.FDA_DD_IMPORT_ENDPOINT || "import_refusals").trim()

  if (!authUser || !authKey) {
    const res = NextResponse.json({ error: "Missing FDA_DD_AUTH_USER or FDA_DD_AUTH_KEY" }, { status: 400 })
    res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
    return res
  }

  try {
    // First try the configured endpoint
    let { ok, j, status } = await callDD(endpoint, authUser, authKey, months, rowsParam)

    // If the endpoint itself is invalid, auto-fallback to the known slug
    if (!ok && (status === 404 || (j?.message||"").toLowerCase().includes("invalid request endpoint"))) {
      ({ ok, j, status } = await callDD("import_refusals", authUser, authKey, months, rowsParam))
      endpoint = "import_refusals"
    }

    if (!ok || (j?.statuscode && j.statuscode !== 400)) {
      const res = NextResponse.json({ data: [], error: true, errorDetail: `DD ${j?.statuscode ?? status}: ${j?.message ?? ""}` }, { status: 502 })
      res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
      return res
    }

    const result: any[] = Array.isArray(j?.result) ? j.result : []
    const data: Row[] = result.map((x: any) => ({
      id: `${(x.RefusalDate||"").slice(0,10)}-${x.FirmName||""}-${x.ProductCode||""}`.slice(0,80),
      date: String(x.RefusalDate || "").slice(0,10),
      product: String(x.ProductCode || ""),
      country: String(x.CountryName || ""),
      reason: String(x.RefusalCharges || ""),
      firm: String(x.FirmName || ""),
      code: String(x.FEINumber || ""),
      source: "FDA-DD"
    }))

    const res = NextResponse.json({ data, endpoint, resultcount: j?.resultcount ?? data.length, fetchedAt: new Date().toISOString() })
    res.headers.set("Cache-Control","s-maxage=300, stale-while-revalidate=600")
    return res
  } catch (e:any) {
    const res = NextResponse.json({ data: [], error: true, errorDetail: String(e?.message || e) }, { status: 502 })
    res.headers.set("Cache-Control","s-maxage=60, stale-while-revalidate=120")
    return res
  }
}
