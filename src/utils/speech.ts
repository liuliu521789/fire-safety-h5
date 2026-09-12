import { setBgmDucked } from '@/utils/bgm'

let preferredVoice: SpeechSynthesisVoice | null = null
let speakGeneration = 0
let keepAliveTimer: number | null = null
let unlocked = false

function pickZhVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  preferredVoice =
    voices.find((v) => /zh-CN|zh_CN|Chinese.*China/i.test(`${v.lang} ${v.name}`)) ||
    voices.find((v) => /xiaoxiao|yaoyao|huihui|kangkang|tingting|chinese/i.test(v.name)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    null
  return preferredVoice
}

function waitForVoices(timeoutMs = 1200): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve()
  if (window.speechSynthesis.getVoices().length > 0) {
    pickZhVoice()
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.speechSynthesis.removeEventListener('voiceschanged', onChange)
      window.clearTimeout(timer)
      pickZhVoice()
      resolve()
    }
    const onChange = () => finish()
    const timer = window.setTimeout(finish, timeoutMs)
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    window.speechSynthesis.getVoices()
  })
}

function startKeepAlive() {
  if (keepAliveTimer != null) return
  keepAliveTimer = window.setInterval(() => {
    if (!window.speechSynthesis) return
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.resume()
      } catch {
        // ignore
      }
    }
  }, 200)
}

function stopKeepAlive() {
  if (keepAliveTimer == null) return
  window.clearInterval(keepAliveTimer)
  keepAliveTimer = null
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickZhVoice()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    pickZhVoice()
  })
}

export function stopSpeak() {
  speakGeneration += 1
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    setBgmDucked(false)
    stopKeepAlive()
    return
  }
  try {
    window.speechSynthesis.cancel()
  } catch {
    // ignore
  }
  setBgmDucked(false)
  stopKeepAlive()
}

export function canSpeak() {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

/**
 * 必须在用户点击/触摸回调里同步调用，用于解锁移动端语音权限。
 */
export function unlockSpeech() {
  if (!canSpeak()) return
  pickZhVoice()
  try {
    window.speechSynthesis.resume()
  } catch {
    // ignore
  }
  if (unlocked) return
  unlocked = true
  try {
    const warm = new SpeechSynthesisUtterance(' ')
    warm.volume = 0
    warm.rate = 2
    warm.lang = 'zh-CN'
    window.speechSynthesis.speak(warm)
  } catch {
    // ignore
  }
}

/** 浏览器中文语音播报（Web Speech API） */
export async function speak(text: string, enabled = true, rate = 1): Promise<void> {
  if (!enabled || !text.trim()) return
  if (!canSpeak()) return

  await waitForVoices()

  const synth = window.speechSynthesis
  const wasBusy = synth.speaking || synth.pending
  stopSpeak()
  const gen = speakGeneration

  // 仅在打断上一段时等待，避免打断用户手势授权链
  if (wasBusy) {
    await new Promise((r) => window.setTimeout(r, 80))
    if (gen !== speakGeneration) return
  }

  await new Promise<void>((resolve) => {
    if (gen !== speakGeneration) {
      resolve()
      return
    }

    const utter = new SpeechSynthesisUtterance(text)
    const voice = preferredVoice || pickZhVoice()
    if (voice) utter.voice = voice
    utter.lang = voice?.lang || 'zh-CN'
    utter.rate = Math.min(1.15, Math.max(0.85, rate))
    utter.pitch = 1
    utter.volume = 1

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      if (gen === speakGeneration) {
        setBgmDucked(false)
        stopKeepAlive()
      }
      resolve()
    }

    utter.onend = finish
    utter.onerror = finish

    setBgmDucked(true)
    startKeepAlive()
    try {
      synth.speak(utter)
      synth.resume()
    } catch {
      finish()
      return
    }

    window.setTimeout(finish, Math.min(20000, 1200 + text.length * 280))
  })
}

export async function speakSequence(
  lines: string[],
  enabled = true,
  gapMs = 220,
  onLine?: (line: string, index: number) => void,
): Promise<void> {
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    onLine?.(line, index)
    if (enabled) {
      await speak(line, true)
    } else {
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (gapMs > 0) await new Promise((r) => setTimeout(r, gapMs))
  }
}
