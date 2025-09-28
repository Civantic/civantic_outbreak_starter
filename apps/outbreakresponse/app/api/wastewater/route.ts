// apps/outbreakresponse/app/api/wastewater/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

type Pt = { date: string; value: number; detected?: boolean };

function toISO(d: Date) { return d.toISOString().slice(0, 10); }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

// Return the first key that exists in obj from a preference list (case-insensitive)
function pickKey(obj: any, prefs: string[]): string | undefined {
  const keys = Object.keys(obj || {});
  const lower = new Map(keys.map(k => [k.toLowerCase(), k]));
  for (const p of prefs) {
    const k = lower.get(p.toLowerCase());
    if (k) return k;
  }
  return undefined;
}

// Find any key that contains a substring (case-insensitive)
function findContainsKey(obj: any, substrings: string[]): string | undefined {
  const keys = Object.keys(obj || {});
  const lks = keys.map(k => [k.toLowerCase(), k]) as [string, string][];
  for (const [lk, k] of lks) {
    if (substrings.some(s => lk.includes(s.toLowerCase()))) return k;
  }
  return undefined;
}

// Very tolerant row → Pt normalizer
function normalizeRows(rows: any[]): Pt[] {
  const out: Pt[] = [];

  for (const r of rows) {
    if (!r || typeof r !== "object") continue;

    // 1) Date: try common names, then “any field containing ‘date’”
    const dateKey =
      pickKey(r, [
        "date", "submission_date", "sample_date", "sample_collect_date",
        "collection_date", "week_start", "week_end", "week", "wk_start", "wk_end", "as_of_date", "day"
      ]) || findContainsKey(r, ["date"]);

    const rawDate = dateKey ? String(r[dateKey]) : "";
    const date = rawDate ? String(rawDate).slice(0, 10) : "";

    // 2) Value: prefer wastewater percentile variants, then any ‘percentile’/‘value’/‘median’
    const valueKey =
      pickKey(r, [
        "wastewater_percentile", "wastewater_percentile_7d", "percentile",
        "value", "median", "p75", "p80"
      ]) || findContainsKey(r, ["percentile", "value", "median"]);

    const nv = Number(valueKey ? r[valueKey] : NaN);
    const value = isFinite(nv) ? nv : 0;

    // 3) Detection flag: “detectable” if present; otherwise treat value>0 as detected
    const detectableKey =
      pickKey(r, ["detectable", "detected"]) || findContainsKey(r, ["detect"]);

    const detected =
      typeof r[detectableKey as string] !== "undefined"
        ? String(r[detectableKey as string]).toLowerCase() === "true" ||
          String(r[detectableKey as string]).toLowerCase() === "yes" ||
          String(r[detectableKey as string]) === "1"
        : value > 0;

    if (date) {
      out.push({ date, value, detected });
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const monthsRaw = parseInt(url.searchParams.get("months") || "6", 10);
  const state = (url.searchParams.get("state") || "").toUpperCase();
  const debug = url.searchParams.get("debug") === "1";
  const months = clamp(isFinite(monthsRaw) ? monthsRaw : 6, 1, 12);

  const NWSS = process.env.NWSS_API_URL;
  if (!NWSS) {
    return NextResponse.json(
      { series: [], error: true, message: "NWSS_API_URL not set", fallback: true },
      { status: 200, headers: { "Cache-Control": "public, max-age=120" } }
    );
  }

  // Time window
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceISO = toISO(since);

  // Build candidate fetch URLs. Start with the most generic (raw + limit),
  // then try Socrata SELECT/WHERE variants with different field names.
  const candidates: string[] = [];

  // 0) Raw fetch (no WHERE), just increase limit
  candidates.push(`${NWSS}?$limit=50000`);

  function addCandidate(dateField: string, stateField?: string) {
    let where = `${dateField} >= "${sinceISO}"`;
    if (state && stateField) where += ` AND upper(${stateField}) = "${state}"`;
    // Select a superset of fields; Socrata ignores unknown selects
    const select =
      `${dateField} as date, wastewater_percentile, wastewater_percentile_7d, percentile, value, median, detectable, detected`;
    const u =
      `${NWSS}?` +
      `$select=${encodeURIComponent(select)}` +
      `&$where=${encodeURIComponent(where)}` +
      `&$order=${encodeURIComponent(dateField + " ASC")}` +
      `&$limit=50000`;
    candidates.push(u);
  }

  // 1) Common combinations
  addCandidate("date", "state");
  addCandidate("submission_date", "state");
  addCandidate("date", "state_abbreviation");
  addCandidate("submission_date", "state_abbreviation");
  addCandidate("sample_date", "state");
  addCandidate("sample_collect_date", "state");

  const headers: HeadersInit = {};
  if (process.env.CDC_APP_TOKEN) headers["X-App-Token"] = process.env.CDC_APP_TOKEN as string;

  let rows: any[] = [];
  const attempts: { url: string; ok: boolean; status?: number; err?: string }[] = [];

  for (const u of candidates) {
    try {
      const r = await fetch(u, { headers, next: { revalidate: 1800 } });
      if (!r.ok) {
        attempts.push({ url: u, ok: false, status: r.status, err: await r.text().catch(() => r.statusText) });
        continue;
      }
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        rows = data;
        attempts.push({ url: u, ok: true });
        break;
      } else {
        attempts.push({ url: u, ok: true });
        // keep looping to try a better-shaped response
      }
    } catch (e: any) {
      attempts.push({ url: u, ok: false, err: String(e?.message || e) });
    }
  }

  const series = normalizeRows(rows);
  const last14 = series.slice(-14);
  const detectionRate14d =
    last14.length > 0
      ? Math.round((last14.filter((p) => p.detected).length / last14.length) * 100)
      : 0;
  const latest = series.slice(-1)[0]?.value ?? 0;

  // If we ended up with series length 0, return debug info so you can inspect field names.
  if (series.length === 0) {
    const probe = rows.slice(0, 3).map((r) => Object.keys(r || {}));
    return NextResponse.json(
      {
        series: [],
        latest: 0,
        detectionRate14d: 0,
        fallback: false, // request succeeded but we couldn't normalize
        debug: debug ? { attempts, probe, sampleRow: rows[0] } : undefined
      },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage: 600" } as any }
    );
  }

  return NextResponse.json(
    {
      series,
      latest,
      detectionRate14d,
      fallback: false,
      debug: debug ? { attempts, sampleRow: rows[0] } : undefined
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, max-age=600, stale-while-revalidate=86400",
      },
    }
  );
}
