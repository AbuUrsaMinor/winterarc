export function getTargets(day) {
  return {
    pushups: day,
    situps: day,
    plankSecs: 30 + (day - 1) * 5,
  }
}

export function formatPlank(secs) {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function formatLifetimePlank(totalSecs) {
  if (totalSecs < 60) return `${totalSecs}s`
  const m = Math.floor(totalSecs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm === 0 ? `${h}h` : `${h}h ${rm}m`
}

export function toISODate(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export function daysBetween(from, to) {
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  return Math.round((b - a) / 86_400_000)
}
