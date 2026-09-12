export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds))
  return `00:${String(s).padStart(2, '0')}`
}

export function scoreLabel(score: number) {
  if (score >= 90) return '卓越'
  if (score >= 75) return '良好'
  if (score >= 60) return '达标'
  return '待提升'
}
