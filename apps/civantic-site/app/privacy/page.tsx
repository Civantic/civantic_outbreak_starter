export const metadata = {
  title: "Privacy · Civantic LLC",
  description: "How Civantic LLC handles information shared via this website.",
  alternates: { canonical: "/privacy" }
}

export default function PrivacyPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl prose">
        <h1>Privacy Policy</h1>
        <p>This site only collects information you intentionally provide (for example, via the contact form or email links). We use it solely to respond to your inquiry and deliver purchased products or services.</p>
        <p>If third-party checkout, analytics, or embeds are used, their policies apply in addition to this page. You can request updates or deletion of your information at any time.</p>
        <p>Questions: <a href="mailto:info@civantic.com">info@civantic.com</a></p>
      </div>
    </section>
  )
}
