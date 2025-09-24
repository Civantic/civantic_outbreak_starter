import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Products (Beta) · Civantic LLC",
  description:
    "Practical toolkits that turn policy into repeatable practice. Join the beta for early access to Civantic toolkits.",
  robots: { index: false, follow: true }
}

export default function ProductsComingSoon() {
  return (
    <div>
      <section className="container py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Products (Beta)</h1>
        <p className="mt-4 text-lg text-gray-600">
          Practical toolkits that turn policy into repeatable practice. Join the beta for early access.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href={`mailto:info@civantic.com?subject=${encodeURIComponent("Join the Civantic product beta")}&body=${encodeURIComponent(
              "Hi—please add me to the early-access list for Civantic products.\n\nName:\nOrganization:\nWhich product(s):\nTimeline:"
            )}`}
            className="btn btn-primary"
            aria-label="Email Civantic to join the product beta"
          >
            Join the beta
          </a>
          <Link href="/contact" className="btn btn-outline">Ask a question</Link>
          <a
            href="https://outbreakresponse.com"
            className="btn btn-outline"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open OutbreakResponse.com in a new tab"
          >
            OutbreakResponse (live)
          </a>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6">
            <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">Early access</div>
            <h3 className="mt-3 text-xl font-semibold">Food Truck Permit + Safety Package</h3>
            <p className="mt-2 text-gray-600">Turnkey forms, standard operating procedures, and guidance to pass permits with confidence.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span><strong>Who it’s for:</strong> mobile food operators and small food businesses</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>Includes:</strong> checklists, SOPs, logs, and readiness review</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>Format:</strong> editable docs and PDFs</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>ETA:</strong> Q4</span></li>
            </ul>
            <div className="mt-4">
              <a
                href={`mailto:info@civantic.com?subject=${encodeURIComponent("Food Truck Package — early access")}&body=${encodeURIComponent(
                  "Hi—please add me to early access for the Food Truck Package.\n\nName:\nCity/County:\nPlanned launch date:"
                )}`}
                className="btn btn-outline"
              >
                Join waitlist
              </a>
            </div>
          </div>

          <div className="card p-6">
            <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">Early access</div>
            <h3 className="mt-3 text-xl font-semibold">Recall-Readiness Toolkit</h3>
            <p className="mt-2 text-gray-600">Decision tree, call scripts, media templates, and drill plan—so your team knows what to do on day one.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span><strong>Who it’s for:</strong> processors, distributors, and retail</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>Includes:</strong> scripts, templates, and escalation matrix</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>Format:</strong> Google/Word templates and PDF guide</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>ETA:</strong> Q4</span></li>
            </ul>
            <div className="mt-4">
              <a
                href={`mailto:info@civantic.com?subject=${encodeURIComponent("Recall-Readiness Toolkit — early access")}&body=${encodeURIComponent(
                  "Hi—please add me to early access for the Recall-Readiness Toolkit.\n\nName:\nFacility type:\nPrimary contact:"
                )}`}
                className="btn btn-outline"
              >
                Join waitlist
              </a>
            </div>
          </div>

          <div className="card p-6">
            <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">Waitlist</div>
            <h3 className="mt-3 text-xl font-semibold">FSMA Section 204 Traceability Plan Builder</h3>
            <p className="mt-2 text-gray-600">Guided worksheets to build a workable, compliant plan under the Food Safety Modernization Act (FSMA) Section 204.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span>•</span><span><strong>Who it’s for:</strong> covered foods and supply chain partners</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>Includes:</strong> worksheets, checks, and example records</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>Format:</strong> spreadsheets and step-by-step guide</span></li>
              <li className="flex gap-2"><span>•</span><span><strong>ETA:</strong> Q1</span></li>
            </ul>
            <div className="mt-4">
              <a
                href={`mailto:info@civantic.com?subject=${encodeURIComponent("FSMA 204 Traceability Plan Builder — waitlist")}&body=${encodeURIComponent(
                  "Hi—please add me to the waitlist for the FSMA 204 Builder.\n\nName:\nRole:\nCompany:"
                )}`}
                className="btn btn-outline"
              >
                Join waitlist
              </a>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-600">
          We build for real-world use with public regulations and industry best practices. Confirm local requirements with your health department.
          This page is informational and not legal advice.
        </p>

        <p className="mt-3 text-center text-sm text-gray-600">
          Looking for a live product today?
          <a
            href="https://outbreakresponse.com"
            className="ml-2 text-brand-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit OutbreakResponse.com
          </a>
        </p>
      </section>
    </div>
  )
}
