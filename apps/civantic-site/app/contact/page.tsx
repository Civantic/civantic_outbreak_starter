"use client"

export default function ContactPage() {
  const handleSubmit = (e: any) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") || "")
    const email = String(fd.get("email") || "")
    const message = String(fd.get("message") || "")
    const subject = `New inquiry from ${name}`
    const body = `${message}\n\nFrom: ${name} <${email}>`
    const url = `mailto:info@civantic.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = url
  }

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Contact</h1>
        <p className="mt-4 text-lg text-gray-600">Tell us your goals and constraints. We’ll reply with next steps.</p>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input id="name" name="name" required className="w-full rounded-xl border p-3" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" required className="w-full rounded-xl border p-3" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <textarea id="message" name="message" rows={6} required className="w-full rounded-xl border p-3" />
          </div>
          <button type="submit" className="btn btn-primary">Send email</button>
        </form>

        <div className="mt-8 card p-6 text-sm text-gray-700">
          <div>Civantic LLC</div>
          <div>Cedar Crest, New Mexico</div>
          <div>info@civantic.com</div>
        </div>
      </div>
    </section>
  )
}
