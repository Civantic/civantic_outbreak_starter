import pop from "../data/statePop.json"

export function ratePer100k(abbr: string, count: number) {
  const p = (pop as Record<string, number>)[abbr.toUpperCase()]
  if (!p || !count) return 0
  return Math.round((count / p) * 100000)
}
