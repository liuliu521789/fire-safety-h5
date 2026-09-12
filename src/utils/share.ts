export async function shareChallenge(score: number) {
  const title = '火线行动：消防安全挑战'
  const text = `我在《火线行动》获得 ${score} 分，快来挑战消防安全任务！`
  const url = window.location.href.split('#')[0]

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch {
      // user cancelled
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    return 'copied' as const
  } catch {
    return false
  }
}
