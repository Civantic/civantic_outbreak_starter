// apps/outbreakresponse/app/api/adverse-events/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

type Ev = {
  id: string;
  date: string;
  products: string[];
  reactions: string[];
  reporter?: string;
  source: string;
};

function yyyymmdd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${da}`;
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Small sample used only when openFDA fails, so the page doesn't look broken.
function sampleCAERS(months: number): Ev[] {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - months);
  return [
    {
      id: "caers-demo-1",
      date: iso(start),
      products: ["Packaged salad"],
      reactions: ["Nausea", "Vomiting"],
      reporter: "Consumer",
      source: "openFDA CAERS (fallback)",
    },
    {
      id: "caers-demo-2",
      date: iso(new Date(start.getTime() + 1000 * 60 * 60 * 24 * 21)),
      products: ["Peanut butter"],
      reactions: ["Allergic reaction"],
      reporter: "Consumer",
      source: "openFDA CAERS (fallback)",
    },
  ];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const months = Math.max(1, Math.min(12, Number(searchParams.get("months") || "6")));

  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const end = new Date();

  const START = yyyymmdd(start);
  const END = yyyymmdd(end);

  const API = "https://api.fda.gov/food/event.json";
  const KEY = process.env.OPENFDA_API_KEY || "";

  // Correct openFDA range format: [YYYYMMDD TO YYYYMMDD]
  // We'll query by date_created; if you prefer date_started, swap the field name below.
  const qs = new URLSearchParams({
    search: `date_created:[${START}+TO+${END}]`,
    limit: "100",
  });
  if (KEY) qs.set("api_key", KEY);

  let data: Ev[] = [];
  let fallback = false;
  let error = false;
  let errDetail = "";

  try {
    const url = `${API}?${qs.toString()}`;
    const resp = await fetch(url, { next: { revalidate: 600 } });
    if (!resp.ok) {
      error = true;
      errDetail = `openFDA ${resp.status}`;
      throw new Error(`openFDA not ok: ${resp.status}`);
    }
    const json: any = await resp.json();
    const rows: any[] = Array.isArray(json?.results) ? json.results : [];

    data = rows.map((r: any, i: number) => {
      const date =
        r.date_created ||
        r.date_started ||
        r.date ||
        iso(start);
      const products = Array.isArray(r.products)
        ? r.products.map((p: any) => p?.name_brand || p?.name || p?.industry_name || "Product").filter(Boolean)
        : [];
      const reactions = Array.isArray(r.reactions)
        ? r.reactions.map((x: any) => String(x)).filter(Boolean)
        : [];
      const reporter = r.reporter || r.qualification || undefined;

      return {
        id: String(r.report_number || r.safetyreportid || r.id || `caers-${i}`),
        date,
        products,
        reactions,
        reporter,
        source: "openFDA CAERS",
      };
    });
  } catch (_e) {
    // Fall back to sample so UI doesn't show "error" state
    fallback = true;
    if (!data.length) data = sampleCAERS(months);
  }

  return NextResponse.json(
    { data, fallback, error, detail: errDetail },
    { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=86400" } }
  );
}
