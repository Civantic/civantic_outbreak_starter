export const metadata = {
  title: "Sources · OutbreakResponse",
  alternates: { canonical: "/sources" }
}

export default function SourcesPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl prose">
        <h1>Sources and methodology</h1>
        <p>OutbreakResponse aggregates public datasets to provide decision-ready views. Counts may lag official reports; always consult the primary publication for the canonical record.</p>

        <h2>Public health</h2>
        <ul>
          <li><strong>CDC NORS</strong> — outbreak summaries used for illnesses, hospitalizations, deaths, etiology, and month/state rollups.</li>
          <li><strong>CDC NWSS</strong> — wastewater percentile trend (0–100) averaged by submission date; used for context alongside outbreaks/recalls.</li>
        </ul>

        <h2>Food safety</h2>
        <ul>
          <li><strong>FDA openFDA Food Enforcement</strong> — recall product/description, reason, classification, distribution (states).</li>
          <li><strong>USDA-FSIS recalls</strong> — recalls for meat & poultry (product, reason, classification, distribution).</li>
          <li><strong>FSIS Public Health Alerts</strong> (planned) — early advisories prior to recalls.</li>
        </ul>

        <h2>Early indicators</h2>
        <ul>
          <li><strong>Adverse Events (openFDA CAERS)</strong> — public complaints for foods/dietary supplements (early signal; not proof of causality).</li>
          <li><strong>FDA Data Dashboard</strong> — Import Refusals (border screening outcomes) and other regulatory datasets.</li>
          <li><strong>FDA Enforcement (IRES)</strong> — enforcement report drill-downs for additional context.</li>
        </ul>

        <h2>State & local</h2>
        <ul>
          <li><strong>NM DOH curated updates</strong> — manually added from NMDOH press releases or advisories when relevant to the New Mexico view.</li>
        </ul>

        <h2>Update cadence & treatment</h2>
        <ul>
          <li>All routes request fresh data on load; some apply light aggregation (e.g., month bucketing for outbreaks).</li>
          <li>Where agency endpoints rate-limit or temporarily error, the site may display a clearly labeled “fallback” dataset for continuity.</li>
          <li>Wastewater is a relative index vs historical baseline; it is not a case count.</li>
        </ul>

        <h2>Known caveats</h2>
        <ul>
          <li>Recall “distribution” patterns vary by agency; “Nationwide” is treated as affecting all states.</li>
          <li>NORS public summaries are typically retrospective and may lag field findings.</li>
          <li>CAERS and import refusals are early indicators; use in context with recalls/outbreaks.</li>
        </ul>

        <p>Questions or additions: <a href="mailto:info@civantic.com">info@civantic.com</a></p>
      </div>
    </section>
  )
}
