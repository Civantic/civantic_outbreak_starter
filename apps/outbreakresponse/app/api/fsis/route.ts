// apps/outbreakresponse/app/api/fsis/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

type Row = {
  id: string;
  date: string;
  stateScope: string[];
  product: string;
  reason: string;
  source: string;
};

function iso(d: Date) { return d.toISOString().slice(0,10); }
function toDate(v: any): string {
  if (!v) return "";
  // Try ISO or YYYY-MM-DD-ish
  const s = String(v);
  const m = s.match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return isNaN(+d) ? "" : iso(d);
}

function monthsAgoStart(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  return d;
}

const ALL_STATES = [
  "WA","OR","CA","AK","HI","ID","NV","AZ","UT","MT","WY","CO","NM","ND","SD","NE","KS","OK","TX","MN","IA","MO","AR","LA","WI","IL","MI","IN","KY","TN","MS","AL","FL","GA","SC","NC","VA","WV","OH","PA","NY","VT","NH","ME","MA","RI","CT","NJ","DE","MD","DC"
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "US").toUpperCase();
  const months = Math.max(1, Math.min(12, Number(searchParams.get("months") || "6")));
  const since = monthsAgoStart(months);

  const BASE = process.env.FSIS_API_URL || ""; // ex: https://www.fsis.usda.gov/fsis/api/recall/v/1

  let rows: Row[] = [];
  let fallback = false;
  let error = false;
  let detail = "";

  try {
    if (!BASE) throw new Error("FSIS_API_URL missing");

    // Most FSIS APIs return an array at top-level; some return {data:[...]}.
    // We keep it tolerant.
    const url = BASE; // if your API needs a path (e.g. /recalls), append here
    const resp = await fetch(url, {
      // Let edge cache for 10 min; disable short aborts.
      next: { revalidate: 600 },
    });

    if (!resp.ok) {
      error = true;
      detail = `FSIS ${resp.status}`;
      throw new Error(detail);
    }

    const json: any = await resp.json();
    const list: any[] =
      Array.isArray(json) ? json :
      Array.isArray(json?.data) ? json.data :
      Array.isArray(json?.results) ? json.results :
      [];

    rows = list.map((r: any, i: number) => {
      // Try common field names; normalize.
      const date =
        toDate(r.recall_initiation_date || r.start_date || r.date || r.recallDate);
      const product =
        r.product_description || r.product || r.title || r.description || "Recall";
      const reason =
        r.reason_for_recall || r.summary || r.reason || "";
      // States may be an array or a comma string.
      let stateScope: string[] = [];
      if (Array.isArray(r.states)) {
        stateScope = r.states.map((s: any) => String(s).trim().toUpperCase());
      } else if (typeof r.states === "string") {
        stateScope = r.states.split(/[,|]/).map((s: string) => s.trim().toUpperCase()).filter(Boolean);
      } else if (r.state) {
        stateScope = [String(r.state).toUpperCase()];
      }

      return {
        id: String(r.recall_number || r.recallID || r.id || `fsis-${i}`),
        date: date || iso(monthsAgoStart(months)),
        stateScope,
        product,
        reason,
        source: "USDA FSIS",
      };
    });

    // Filter by date window
    rows = rows.filter((x) => {
      const d = new Date(x.date);
      return !isNaN(+d) && d >= since;
    });

    // Scope: include nationwide recalls (if we detect "all states").
    if (scope === "NM") {
      rows = rows.filter(
        (r) => r.stateScope.includes("NM") || r.stateScope.length === ALL_STATES.length
      );
    }
  } catch (_e) {
    // Return empty but mark fallback, so it doesn't show scary errors
    fallback = true;
    if (!rows.length) rows = [];
  }

  return NextResponse.json(
    { data: rows, fallback, error, detail },
    { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=86400" } }
  );
}
