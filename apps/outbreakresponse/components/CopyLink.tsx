"use client"

export default function CopyLink({ className = "btn btn-outline" }: { className?: string }) {
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href) } catch {}
  }
  return <button onClick={copy} className={className}>Copy link</button>
}
