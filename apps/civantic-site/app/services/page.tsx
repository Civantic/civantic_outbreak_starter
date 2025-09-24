import Link from "next/link"

export default function ServicesPage() {
  return (
    <div>
      <section className="container py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Services</h1>
        <p className="mt-4 text-lg text-gray-600">
          Modernizing public health, food safety, and health administration—without adding bureaucracy.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/contact" className="btn btn-primary">Book a working session</Link>
          <a
            href="https://outbreakresponse.com"
            className="btn btn-outline"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open OutbreakResponse.com in a new tab"
          >
            OutbreakResponse dashboards
          </a>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-xl font-semibold">Program & project management</h3>
            <p className="mt-2 text-gray-600">Plans, roles, timelines, and delivery you can track.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Delivery roadmaps and OKRs</span></li>
              <li className="flex gap-2"><span>•</span><span>Work plans with clear roles and responsibilities (RACI)</span></li>
              <li className="flex gap-2"><span>•</span><span>Status dashboards with risks, decisions, and dependencies</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Enterprise risk management</h3>
            <p className="mt-2 text-gray-600">Identify, prioritize, and mitigate risks across programs.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Risk register and scoring model</span></li>
              <li className="flex gap-2"><span>•</span><span>Controls library, owners, and monitoring cadence</span></li>
              <li className="flex gap-2"><span>•</span><span>Executive reporting with thresholds and trends</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Dashboards & analytics</h3>
            <p className="mt-2 text-gray-600">Decision-ready views with automated refresh and clear sourcing.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>FDA and CDC feeds where appropriate</span></li>
              <li className="flex gap-2"><span>•</span><span>Choropleths, trends, and KPIs</span></li>
              <li className="flex gap-2"><span>•</span><span>Shareable embeds, briefs, and CSV exports</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Change management</h3>
            <p className="mt-2 text-gray-600">Plan, communicate, and land new processes and systems.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Stakeholder mapping and champions network</span></li>
              <li className="flex gap-2"><span>•</span><span>Plain-language training, job aids, and comms</span></li>
              <li className="flex gap-2"><span>•</span><span>Adoption and readiness metrics with feedback loops</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Strategic planning</h3>
            <p className="mt-2 text-gray-600">Set a clear direction and measure progress.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Environmental scan and prioritized objectives</span></li>
              <li className="flex gap-2"><span>•</span><span>Strategy map, resourcing, and sequencing</span></li>
              <li className="flex gap-2"><span>•</span><span>Scorecards and quarterly reviews</span></li>
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold">Policy & compliance</h3>
            <p className="mt-2 text-gray-600">Turn policy into clear SOPs and audit-ready evidence.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Policy drafting and updates</span></li>
              <li className="flex gap-2"><span>•</span><span>SOPs, checklists, and job aids</span></li>
              <li className="flex gap-2"><span>•</span><span>Mock inspections and evidence packages</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <h2 className="text-2xl font-bold tracking-tight text-center">Ways to work together</h2>
        <p className="mt-2 text-center text-gray-600">Pick the path that fits your timeline and risk.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Assessment (2 weeks)</h3>
            <p className="mt-2 text-gray-600">Rapid clarity and a prioritized plan.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Interviews and artifact review</span></li>
              <li className="flex gap-2"><span>•</span><span>Findings, risks, and quick wins</span></li>
              <li className="flex gap-2"><span>•</span><span>Roadmap with metrics and owners</span></li>
            </ul>
          </div>
          <div className="card p-6 border-2 border-brand-700">
            <h3 className="text-lg font-semibold">Delivery sprint (6-8 weeks)</h3>
            <p className="mt-2 text-gray-600">Build and prove value fast.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Working solution (pilot or SOPs)</span></li>
              <li className="flex gap-2"><span>•</span><span>Weekly demos and status dashboard</span></li>
              <li className="flex gap-2"><span>•</span><span>Before/after metrics and handover</span></li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Program partnership (quarterly)</h3>
            <p className="mt-2 text-gray-600">Sustained outcomes with governance.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span>Backlog, governance, and risk controls</span></li>
              <li className="flex gap-2"><span>•</span><span>Change management and training</span></li>
              <li className="flex gap-2"><span>•</span><span>Quarterly review and re-plan</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-semibold">What success looks like</h2>
          <ul className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
            <li className="flex gap-2"><span>•</span><span>Shorter cycle times and fewer handoffs</span></li>
            <li className="flex gap-2"><span>•</span><span>On-time reporting with clear ownership</span></li>
            <li className="flex gap-2"><span>•</span><span>Audit-ready documentation and evidence</span></li>
            <li className="flex gap-2"><span>•</span><span>Adoption metrics and training completion</span></li>
            <li className="flex gap-2"><span>•</span><span>Risk exposure reduced, controls monitored</span></li>
            <li className="flex gap-2"><span>•</span><span>Decision support that leaders actually use</span></li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            Services align with Civantic’s mission in organizational development, program and project management, food safety, and policy.
          </p>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold">How we deliver</h2>
            <ol className="mt-4 space-y-2 text-sm text-gray-700 list-decimal pl-5">
              <li>Discovery: outcomes, constraints, and stakeholders</li>
              <li>Plan: milestones, risks, and measures of success</li>
              <li>Delivery: weekly demos, decisions, and status</li>
            </ol>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <details>
                <summary className="font-medium">Do you work fixed-fee or time-and-materials?</summary>
                <div className="mt-1 text-gray-600">Both—assessments and sprints are typically fixed-fee; partnerships are monthly or quarterly.</div>
              </details>
              <details>
                <summary className="font-medium">What datasets do you use for dashboards?</summary>
                <div className="mt-1 text-gray-600">We start with your internal data and, where appropriate, public sources such as FDA and CDC feeds. All charts show clear sourcing and update cadence.</div>
              </details>
              <details>
                <summary className="font-medium">Can you support audits and inspections?</summary>
                <div className="mt-1 text-gray-600">Yes—policy translation, SOPs, readiness checklists, and evidence packs mapped to requirements.</div>
              </details>
              <details>
                <summary className="font-medium">How soon can we start?</summary>
                <div className="mt-1 text-gray-600">We begin with a working session to confirm scope and outcomes, then schedule the assessment or sprint.</div>
              </details>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center">
          <Link href="/contact" className="btn btn-primary">Start with a working session</Link>
        </div>
      </section>
    </div>
  )
}
