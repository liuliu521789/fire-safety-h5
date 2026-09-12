let preferredVoice: SpeechSynthesisVoice | null = null

function pickZhVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  preferredVoice =
    voices.find((v) => /zh-CN|zh_CN|Chinese.*China/i.test(`${v.lang} ${v.name}`)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    null
  return preferredVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickZhVoice()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    pickZhVoice()
  })
}

export function stopSpeak() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

/** 浏览器中文语音播报（Web Speech API） */
export function speak(text: string, enabled = true, rate = 1): Promise<void> {
  if (!enabled || !text.trim()) return Promise.resolve()
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve()

  stopSpeak()

  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text)
    const voice = preferredVoice || pickZhVoice()
    if (voice) utter.voice = voice
    utter.lang = voice?.lang || 'zh-CN'
    utter.rate = rate
    utter.pitch = 1
    utter.volume = 1
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    window.speechSynthesis.speak(utter)
  })
}

export function speakSequence(
  lines: string[],
  enabled = true,
  gapMs = 220,
  onLine?: (line: string, index: number) => void,
): Promise<void> {
  return lines.reduce(async (prev, line, index) => {
    await prev
    onLine?.(line, index)
    if (enabled) {
      await speak(line, true)
    } else {
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (gapMs > 0) await new Promise((r) => setTimeout(r, gapMs))
  }, Promise.resolve())
}
