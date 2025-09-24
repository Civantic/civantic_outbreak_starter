export const metadata = {
  title: "Capabilities & Roadmap · OutbreakResponse",
  alternates: { canonical: "/roadmap" }
}

export default function RoadmapPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl prose">
        <h1>Capabilities & roadmap</h1>
        <p>OutbreakResponse helps public health teams and food businesses scan outbreaks, hospitalizations, recalls, wastewater, and adverse events with simple filters, maps, and shareable views.</p>

        <h2>Live</h2>
        <ul>
          <li>Dashboard with US ↔ NM and 3/6/12-month windows</li>
          <li>Recalls (FDA, FSIS) with filters, CSV, category badges</li>
          <li>Adverse Events (openFDA CAERS) with filters and CSV</li>
          <li>Map: tile grid <strong>and choropleth</strong> (rate per 100k)</li>
          <li>State drill-downs with rich summaries + NM DOH curated updates</li>
          <li>Wastewater trend with compare and <strong>nowcast</strong> overlay</li>
          <li>Event tracking on key map interactions</li>
        </ul>

        <h2>In progress</h2>
        <ul>
          <li>FDA Data Dashboard: Import Refusals card (tenant-specific fields)</li>
          <li>FDA Enforcement (IRES) card (pilot)</li>
        </ul>

        <h2>Next</h2>
        <ul>
          <li>“Create alert” prototype (mailto) using current filters</li>
          <li>FDA Data Dashboard: Warning Letters panel + firm search</li>
          <li>Trend tiles (7-day change on outbreaks/recalls) and a simple state risk index</li>
          <li>PDF snapshot export (one-pager for leadership)</li>
          <li>FSIS Public Health Alerts (PHAs)</li>
        </ul>

        <h2>Later</h2>
        <ul>
          <li>Nightly cache (Supabase/Postgres) to avoid rate limits & speed up loads</li>
          <li>SVI & population overlays for equity-aware views</li>
          <li>Predictive signals beyond nowcast (e.g., change-point + categorical risk by pathogen/vehicle)</li>
        </ul>

        <p>Work with us: <a href="mailto:info@civantic.com">info@civantic.com</a></p>
      </div>
    </section>
  )
}
