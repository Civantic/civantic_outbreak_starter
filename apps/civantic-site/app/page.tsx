import Link from "next/link"

export default function Page() {
  return (
    <div>
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600">
            <span>Government & Industry • Public Health • Food Safety • Health Administration</span>
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">
            Build safer smarter programs
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Civantic turns policy into repeatable practice—project delivery, enterprise risk management, and decision support you can measure.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/contact" className="btn btn-primary">Book a working session</Link>
            <Link href="/services" className="btn btn-outline">See services</Link>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm text-gray-600">
            <div className="card p-3 text-center">Program & Project Management</div>
            <div className="card p-3 text-center">Enterprise Risk Management</div>
            <div className="card p-3 text-center">Dashboards & Analytics</div>
            <div className="card p-3 text-center">Change Management</div>
            <div className="card p-3 text-center">Strategic Planning</div>
            <div className="card p-3 text-center">Policy & Compliance</div>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            Need live outbreak dashboards?
            <a
              className="ml-2 text-brand-700 hover:underline"
              href="https://outbreakresponse.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open OutbreakResponse.com outbreak and recall dashboard in a new tab"
            >
              OutbreakResponse.com
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-xl font-semibold">Program & project management</h3>
            <p className="mt-2 text-gray-600">Scopes, timelines, budgets, and delivery you can track.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Delivery roadmaps and measurable objectives</span></li>
              <li className="flex gap-2"><span>•</span><span>Work plans with clear roles and responsibilities</span></li>
              <li className="flex gap-2"><span>•</span><span>Status dashboards with risks and decisions</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Enterprise risk management</h3>
            <p className="mt-2 text-gray-600">Identify, prioritize, and mitigate risks across programs.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Risk register and scoring model</span></li>
              <li className="flex gap-2"><span>•</span><span>Controls library and monitoring</span></li>
              <li className="flex gap-2"><span>•</span><span>Executive reporting and risk appetite</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Dashboards & analytics</h3>
            <p className="mt-2 text-gray-600">
              Decision‑ready views using Food and Drug Administration (FDA) and Centers for Disease Control and Prevention (CDC) feeds where appropriate.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Key performance indicators and trend tracking</span></li>
              <li className="flex gap-2"><span>•</span><span>State‑level and facility mapping</span></li>
              <li className="flex gap-2"><span>•</span><span>Shareable briefs and downloadable data exports</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Change management</h3>
            <p className="mt-2 text-gray-600">Plan, communicate, and land new processes and systems.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Stakeholder mapping and champions</span></li>
              <li className="flex gap-2"><span>•</span><span>Plain‑language training and job aids</span></li>
              <li className="flex gap-2"><span>•</span><span>Adoption and readiness metrics</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Strategic planning</h3>
            <p className="mt-2 text-gray-600">Set a clear direction and measure progress.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Environmental scan and priorities</span></li>
              <li className="flex gap-2"><span>•</span><span>Strategy map and resourcing</span></li>
              <li className="flex gap-2"><span>•</span><span>Scorecards and quarterly reviews</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Policy & compliance</h3>
            <p className="mt-2 text-gray-600">Turn policy into clear standard operating procedures and audit‑ready evidence.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Policy drafting and updates</span></li>
              <li className="flex gap-2"><span>•</span><span>Standard operating procedures, checklists, and job aids</span></li>
              <li className="flex gap-2"><span>•</span><span>Mock inspections and evidence package</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center">
          <Link href="/contact" className="btn btn-outline">Book a working session</Link>
        </div>
      </section>
    </div>
  )
}
