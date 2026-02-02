export function parseYtDlpPercent(text: string): number | null {
  const match = text.match(/\[download\]\s+(\d{1,3}\.\d)%/)
  if (!match) return null

  const percent = Math.round(parseFloat(match[1]))
  if (Number.isNaN(percent)) return null
  return percent
}
