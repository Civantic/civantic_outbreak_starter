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

export async function GET(req: Request) {
  const u = new URL(req.url)
  const months = Math.max(1, Math.min(24, Number(u.searchParams.get("months") || 6)))
  const rowsParam = Math.max(1, Math.min(5000, Number(u.searchParams.get("rows") || 200)))

  const authUser = process.env.FDA_DD_AUTH_USER || ""
  const authKey  = process.env.FDA_DD_AUTH_KEY || ""
  const endpoint = (process.env.FDA_DD_IMPORT_ENDPOINT || "import_refusals").trim()

  if (!authUser || !authKey) {
    return NextResponse.json({ error: "Missing FDA_DD_AUTH_USER or FDA_DD_AUTH_KEY" }, { status: 400 })
  }

  const base = `https://api-datadashboard.fda.gov/v1/${endpoint}`

  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  from.setMonth(from.getMonth() - months + 1)

  const body = {
    start: 1,
    rows: rowsParam,
    sort: "RefusalDate",
    sortorder: "DESC",
    filters: {
      RefusalDateFrom: [ymd(from)],
      RefusalDateTo:   [ymd(now)]
    },
    // NOTE: These field names are case-sensitive and may vary by tenant.
    // If DD returns “Invalid fieldname…”, adjust this list to your portal’s “Try It Out” names.
    columns: ["RefusalDate","FirmName","CountryName","ProductCode","FEINumber","RefusalCharges"]
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization-User": authUser,
    "Authorization-Key": authKey,
    "User-Agent": "OutbreakResponse/1.0"
  }

  try {
    const r = await fetch(base, { method: "POST", headers, body: JSON.stringify(body), next: { revalidate: 600 } })
    const text = await r.text()

    let j: any
    try { j = JSON.parse(text) } catch {
      return NextResponse.json({ data: [], error: true, errorDetail: `Non-JSON from DD: ${text.slice(0,300)}` }, { status: 502 })
    }

    // Per DD docs, 400 “Success.” with { result:[…], resultcount:n }
    if (!r.ok || (j?.statuscode && j.statuscode !== 400)) {
      return NextResponse.json({
        data: [],
        error: true,
        errorDetail: `DD ${j?.statuscode ?? r.status}: ${j?.message ?? ""}`
      }, { status: 502 })
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

    return NextResponse.json({ data, resultcount: j?.resultcount ?? data.length, fetchedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ data: [], error: true, errorDetail: String(e?.message || e) }, { status: 502 })
  }
}
