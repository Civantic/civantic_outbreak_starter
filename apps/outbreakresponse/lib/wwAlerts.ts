export function wwAlerts(series: { date: string; value: number }[]) {
  const s = [...series].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const alerts: { date: string; value: number; z: number }[] = []
  for (let i = 14; i < s.length; i++) {
    const window = s.slice(i - 14, i).map(p => p.value)
    const mean = window.reduce((a, b) => a + b, 0) / window.length
    const sd = Math.sqrt(window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, window.length - 1))
    const z = sd ? (s[i].value - mean) / sd : 0
    if (z >= 1.5 && s[i].value >= 75) {
      alerts.push({ date: s[i].date, value: Math.round(s[i].value), z: Math.round(z * 10) / 10 })
    }
  }
  return alerts.slice(-5)
}
