export default function AboutPage() {
  // ---- Check icon size (edit this to change all checks globally) ----
  const CHECK_SIZE = 24; // try 14, 16, 18, 20

  function Check({ size = CHECK_SIZE, className = "" }) {
    return (
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`mt-1 text-blue-600 shrink-0 ${className}`}
      >
        <path
          d="M5 12l4 4L19 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <main>
      {/* Hero */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <header>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              <span aria-hidden="true">★</span>
              Service-Disabled Veteran-Owned Small Business
            </p>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
              About Civantic
            </h1>
            <p className="mt-4 text-lg text-gray-700">
              Civantic helps public agencies and food businesses move from reactive to prepared through practical strategy, measurable delivery, and modern data products.
            </p>
          </header>

          {/* At‑a‑glance (scan-friendly) */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Why teams trust us */}
            <section className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Why teams trust us</h3>
              <p className="mt-2 text-gray-800">
                Delivery in regulated environments.
              </p>
              <ul className="mt-4 space-y-2 leading-7 text-gray-800">
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Program and enterprise risk management</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Change management and adoption in complex orgs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>FDA/CDC/USDA and State level data, dashboards, and performance analytics</span>
                </li>
              </ul>
            </section>

            {/* Where we help first */}
            <section className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Where we help first</h3>
              <ul className="mt-2 space-y-2 leading-7 text-gray-800">
                <li className="flex items-start gap-2">
                  <Check />
                  <span>90‑day program plan: baseline, priorities, cadence</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>ERM baseline: registers, controls, executive rollup</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check />
                  <span>Dashboard quickstart: FDA/CDC/USDA feeds, State DOH data, KPIs, maps</span>
                </li>
              </ul>
            </section>

            {/* How we deliver (full‑width stepper) */}
            <section className="md:col-span-2 rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">How we deliver</h3>
              <ol className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-sm text-gray-600">1</span>
                  <div>
                    <div className="text-gray-900">Discover</div>
                    <p className="text-sm text-gray-600">Goals, stakeholders, measures, constraints</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-sm text-gray-600">2</span>
                  <div>
                    <div className="text-gray-900">Design</div>
                    <p className="text-sm text-gray-600">Workflows, controls, data models, KPIs</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-sm text-gray-600">3</span>
                  <div>
                    <div className="text-gray-900">Deliver</div>
                    <p className="text-sm text-gray-600">Roadmaps, dashboards, training, comms</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-sm text-gray-600">4</span>
                  <div>
                    <div className="text-gray-900">Embed</div>
                    <p className="text-sm text-gray-600">Coaching, KPI monitoring, clean handoff</p>
                  </div>
                </li>
              </ol>
            </section>
          </div>

          {/* Mission + Solutions */}
          <div className="mt-12 prose max-w-none">
            <h2>Mission</h2>
            <p>
              Enable safer, smarter systems by pairing policy expertise with usable tools that shorten time to decision and make risk visible, measurable, and actionable.
            </p>

            <h2>Solutions we implement</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3>Programs and performance</h3>
                <ul>
                  <li>Roadmaps, workplans, and status dashboards</li>
                  <li>Strategy maps, scorecards, and quarterly reviews</li>
                </ul>
              </div>
              <div>
                <h3>Risk and governance</h3>
                <ul>
                  <li>Risk registers, controls, and executive reporting</li>
                  <li>Policy drafting, SOPs, and mock inspections</li>
                </ul>
              </div>
              <div>
                <h3>Data and insight</h3>
                <ul>
                  <li>Dashboards with FDA/CDC feeds, maps, and KPIs</li>
                  <li>Outcome measure integration and KPI definitions</li>
                </ul>
              </div>
              <div>
                <h3>Change and adoption</h3>
                <ul>
                  <li>Change plans, communications, and training assets</li>
                  <li>Stakeholder engagement and readiness assessments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="mailto:info@civantic.com?subject=Civantic%20—%20Discovery%20Call"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              Book a 20‑minute discovery call
            </a>
            <p className="text-sm text-gray-600">
              Prefer email? <a href="mailto:info@civantic.com" className="underline"> info@civantic.com</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
