import Link from "next/link"

export default function ProductPlaceholder() {
  return (
    <section className="container py-20 text-center">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Product coming soon</h1>
      <p className="mt-3 text-gray-600">This product page isn’t live yet.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/products" className="btn btn-primary">Back to products</Link>
        <a href="mailto:info@civantic.com" className="btn btn-outline">Email us</a>
      </div>
    </section>
  )
}
