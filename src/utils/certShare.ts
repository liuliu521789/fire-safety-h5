/** 环境与证书快照：解决微信内外浏览器 localStorage 不互通、下载被拦截 */

export function isWeChat() {
  if (typeof navigator === 'undefined') return false
  return /MicroMessenger/i.test(navigator.userAgent)
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
}

export interface CertSnapshot {
  v: 1
  score: number
  userName: string
  duration: number
  startTime: number | null
  endTime: number | null
  levelScores: {
    hazard: number
    escape: number
    extinguisher: number
    alarm: number
    rescue: number
  }
}

export function encodeCertSnapshot(data: Omit<CertSnapshot, 'v'>): string {
  const payload: CertSnapshot = { v: 1, ...data }
  const json = JSON.stringify(payload)
  // URL-safe base64
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decodeCertSnapshot(raw: string): CertSnapshot | null {
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const json = decodeURIComponent(escape(atob(b64 + pad)))
    const data = JSON.parse(json) as CertSnapshot
    if (!data || typeof data.score !== 'number' || typeof data.userName !== 'string') return null
    return data
  } catch {
    return null
  }
}

/** 生成可在微信外浏览器打开仍保留成绩的证书链接 */
export function buildCertShareUrl(encoded: string) {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/certificate?c=${encodeURIComponent(encoded)}`
}
