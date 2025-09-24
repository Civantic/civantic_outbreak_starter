import { NextResponse } from "next/server"

type RecRow = {
  id: string
  date: string
  product: string
  reason: string
  classification: string
  center: string
  firm?: string
  distribution?: string
  raw?: any
}

function mmddyyyy(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}
function toISO(md?: string) {
  if (!md) return ""
  const m = md.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[1]}-${m[2]}` : md.slice(0,10)
}

export async function GET(req: Request) {
  const urlIn = new URL(req.url)
  const months = Math.max(1, Math.min(36, Number(urlIn.searchParams.get("months") || 6)))
  const classesCsv = (urlIn.searchParams.get("classes") || "1,2,3,NC").toUpperCase()
  const center = (urlIn.searchParams.get("center") || "CFSAN").toUpperCase()

  const authUser = process.env.FDA_ENFORCEMENT_AUTH_USER || ""
  const authKey = process.env.FDA_ENFORCEMENT_AUTH_KEY || ""
  if (!authUser || !authKey) {
    return NextResponse.json({ error: "Missing IRES creds" }, { status: 400 })
  }

  const end = new Date()
  const start = new Date(); start.setMonth(end.getMonth() - months)
  const signature = String(Date.now())
  const endpoint = `https://www.accessdata.fda.gov/rest/iresapi/recalls/?signature=${signature}`

  // minimal payload per FDA doc: filters, sort, sortorder; omit columns to get defaults
  const payload = {
    filters: [
      { eventlmdfrom: mmddyyyy(start) },
      { eventlmdto: mmddyyyy(end) },
      { centerclassificationtypetxt: classesCsv.split(",") },
      { centercd: [center] }
    ],
    start: 1,
    rows: 50,
    sort: "eventlmd",
    sortorder: "DESC"
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json, text/plain, */*",
    "Authorization-User": authUser,
    "Authorization-Key": authKey,
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "User-Agent": "OutbreakResponse/1.0"
  }

  try {
    const body = "payload=" + JSON.stringify(payload)
    const res = await fetch(endpoint, { method: "POST", headers, body, next: { revalidate: 600 } })
    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: `FDA IRES ${res.status}`, errorDetail: text.slice(0, 800) }, { status: 502 })
    }
    let json: any
    try { json = JSON.parse(text) } catch {
      return NextResponse.json({ error: "IRES non-JSON", errorDetail: text.slice(0,800) }, { status: 502 })
    }

    const rows: any[] = Array.isArray(json?.result) ? json.result
      : Array.isArray(json?.rows) ? json.rows
      : Array.isArray(json?.data) ? json.data
      : Array.isArray(json?.results) ? json.results : []

    const data: RecRow[] = rows.map((r: any) => ({
      id: String(r.recallnum || r.recalleventid || r.productid || crypto.randomUUID()),
      date: toISO(String(r.recallinitiationdt || r.enforcementreportdt || r.postedinternetdt || "").trim()),
      product: String(r.productdescriptiontxt || r.productdescription || "").trim(),
      reason: String(r.productshortreasontxt || r.reason || "").trim(),
      classification: String(r.centerclassificationtypetxt || r.classification || "").trim(),
      center: String(r.centercd || r.center || "").trim(),
      firm: String(r.firmlegalnam || r.firm || "").trim(),
      distribution: String(r.distributionareasummarytxt || r.distribution || "").trim(),
      raw: r
    }))

    return NextResponse.json({ data, fetchedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to reach FDA IRES", errorDetail: e?.message || String(e) }, { status: 502 })
  }
}
