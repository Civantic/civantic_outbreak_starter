import type { Metadata } from "next"
import AdverseEventsClient from "./Client"

export const metadata: Metadata = {
  title: "Adverse Events · OutbreakResponse",
  description:
    "Consumer adverse event reports (CAERS) from FDA openFDA with simple filters, KPIs, and export."
}

export default function Page() {
  return <AdverseEventsClient />
}
