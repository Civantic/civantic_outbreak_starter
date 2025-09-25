import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ ok: true, note: "POST to /api/dd with { endpoint, body }" })
}

export async function POST(req: Request) {
  const { endpoint, body } = await req.json().catch(() => ({}))
  const authUser = process.env.FDA_DD_AUTH_USER || ""
  const authKey  = process.env.FDA_DD_AUTH_KEY || ""
  const ep = String(endpoint || process.env.FDA_DD_IMPORT_ENDPOINT || "").trim()

  if (!authUser || !authKey) return NextResponse.json({ error: "Missing FDA_DD_AUTH_USER or FDA_DD_AUTH_KEY" }, { status: 400 })
  if (!ep) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })

  const url = `https://api-datadashboard.fda.gov/v1/${ep}`
  const headers: Record<string,string> = {
    "Content-Type": "application/json",
    "Authorization-User": authUser,
    "Authorization-Key": authKey,
    "User-Agent": "OutbreakResponse/1.0"
  }

  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body || {}), next: { revalidate: 600 } })
    const text = await r.text()
    let j: any
    try { j = JSON.parse(text) } catch { j = { statuscode: r.status, message: "Non-JSON response", raw: text.slice(0,800) } }

    if (!r.ok || (j?.statuscode && j.statuscode !== 400)) {
      return NextResponse.json({ error: "FDA DD error", statuscode: j?.statuscode ?? r.status, message: j?.message ?? "", detail: j?.raw ?? "" }, { status: 502 })
    }
    const result = Array.isArray(j?.result) ? j.result : []
    return NextResponse.json({ data: result, resultcount: j?.resultcount ?? result.length })
  } catch (e: any) {
    return NextResponse.json({ error: "Fetch failed", message: e?.message || String(e) }, { status: 502 })
  }
}
