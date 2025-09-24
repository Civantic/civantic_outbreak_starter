export function track(name: string, props?: Record<string, any>) {
  try {
    if (typeof window !== "undefined" && (window as any).plausible) {
      (window as any).plausible(name, { props })
    }
  } catch {}
}
