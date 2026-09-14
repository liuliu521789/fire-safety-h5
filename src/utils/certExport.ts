/** 证书图片导出：兼容微信（长按保存）与普通浏览器下载 */

import { isWeChat } from '@/utils/certShare'

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('toBlob failed'))
      },
      'image/png',
      0.95,
    )
  })
}

export function canvasToDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/png')
}

/**
 * 尝试触发本地下载。
 * 微信内几乎总是失败或被引导「浏览器打开」，调用方应改走预览长按保存。
 */
export function tryDownloadDataUrl(dataUrl: string, filename: string): boolean {
  if (isWeChat()) return false
  try {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.rel = 'noopener'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch {
    return false
  }
}

export async function tryDownloadBlob(blob: Blob, filename: string): Promise<boolean> {
  if (isWeChat()) return false
  try {
    const url = URL.createObjectURL(blob)
    const ok = tryDownloadDataUrl(url, filename)
    // revoke 稍晚，避免部分浏览器下载未开始
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    return ok
  } catch {
    return false
  }
}
