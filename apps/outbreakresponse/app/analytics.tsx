export default function Analytics() {
  const domain =
    (process.env.NEXT_PUBLIC_SITE_URL || "")
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "") || "localhost"

  return (
    <script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
    />
  )
}
