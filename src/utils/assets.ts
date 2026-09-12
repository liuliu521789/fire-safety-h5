/** 兼容 GitHub Pages 子路径（base: './'）的静态资源路径 */
export function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL || './'
  return `${base}${path.replace(/^\//, '')}`
}
