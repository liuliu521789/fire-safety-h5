import { assetUrl } from '@/utils/assets'
import { setBgmDucked } from '@/utils/bgm'

let preferredVoice: SpeechSynthesisVoice | null = null
let speakGeneration = 0
let keepAliveTimer: number | null = null
let synthUnlocked = false
let audioUnlocked = false
let currentAudio: HTMLAudioElement | null = null

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

function waitForVoices(timeoutMs = 800): Promise<void> {
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

function stopAudio() {
  if (!currentAudio) return
  try {
    currentAudio.pause()
    currentAudio.removeAttribute('src')
    currentAudio.load()
  } catch {
    // ignore
  }
  currentAudio = null
}

export function stopSpeak() {
  speakGeneration += 1
  stopAudio()
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
  }
  setBgmDucked(false)
  stopKeepAlive()
}

/** 预录音频始终可用；Web Speech 仅作兜底 */
export function canSpeak() {
  return typeof Audio !== 'undefined' || (!!window && !!window.speechSynthesis)
}

/**
 * 必须在用户点击/触摸回调里同步调用，用于解锁移动端/微信内音频与语音权限。
 */
export function unlockSpeech() {
  if (typeof window === 'undefined') return

  if (!audioUnlocked && typeof Audio !== 'undefined') {
    audioUnlocked = true
    try {
      const warm = new Audio(assetUrl('audio/voice/intro.mp3'))
      warm.volume = 0
      warm.muted = true
      warm.setAttribute('playsinline', 'true')
      void warm
        .play()
        .then(() => {
          warm.pause()
          warm.currentTime = 0
          warm.muted = false
        })
        .catch(() => {
          // 首次可能仍被拦截，后续真实播报会再试
        })
    } catch {
      // ignore
    }
  }

  if (!window.speechSynthesis) return
  pickZhVoice()
  try {
    window.speechSynthesis.resume()
  } catch {
    // ignore
  }
  if (synthUnlocked) return
  synthUnlocked = true
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

function playAudioClip(name: string, gen: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Audio === 'undefined') {
      resolve(false)
      return
    }

    const audio = new Audio(assetUrl(`audio/voice/${name}.mp3`))
    audio.preload = 'auto'
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
    currentAudio = audio

    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      if (currentAudio === audio) currentAudio = null
      resolve(ok)
    }

    audio.onended = () => finish(true)
    audio.onerror = () => finish(false)

    if (gen !== speakGeneration) {
      finish(false)
      return
    }

    void audio.play().then(
      () => {
        // 播放成功，等 onended
      },
      () => finish(false),
    )

    window.setTimeout(() => {
      if (!settled) finish(false)
    }, 20000)
  })
}

async function speakWithSynthesis(text: string, gen: number, rate = 1): Promise<void> {
  if (!window.speechSynthesis || !text.trim()) return

  await waitForVoices()
  if (gen !== speakGeneration) return

  const synth = window.speechSynthesis
  const wasBusy = synth.speaking || synth.pending
  try {
    synth.cancel()
  } catch {
    // ignore
  }
  if (wasBusy) {
    await new Promise((r) => window.setTimeout(r, 60))
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
      resolve()
    }

    utter.onend = finish
    utter.onerror = finish

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

/**
 * 优先播放预录 mp3（兼容微信/移动端）；失败时回退 Web Speech API。
 */
export async function speakClip(
  clip: string,
  enabled = true,
  fallbackText?: string,
): Promise<void> {
  if (!enabled || !clip) return

  stopAudio()
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
  }
  speakGeneration += 1
  const gen = speakGeneration

  setBgmDucked(true)
  try {
    const ok = await playAudioClip(clip, gen)
    if (ok || gen !== speakGeneration) return
    if (fallbackText) {
      await speakWithSynthesis(fallbackText, gen)
    }
  } finally {
    if (gen === speakGeneration) {
      setBgmDucked(false)
      stopKeepAlive()
    }
  }
}

/** 浏览器中文语音播报（Web Speech API，仅作兜底） */
export async function speak(text: string, enabled = true, rate = 1): Promise<void> {
  if (!enabled || !text.trim()) return

  stopAudio()
  speakGeneration += 1
  const gen = speakGeneration

  setBgmDucked(true)
  try {
    await speakWithSynthesis(text, gen, rate)
  } finally {
    if (gen === speakGeneration) {
      setBgmDucked(false)
      stopKeepAlive()
    }
  }
}

export async function speakClipSequence(
  items: Array<{ clip: string; text: string }>,
  enabled = true,
  gapMs = 220,
  onLine?: (text: string, index: number) => void,
): Promise<void> {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    onLine?.(item.text, index)
    if (enabled) {
      await speakClip(item.clip, true, item.text)
    } else {
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (gapMs > 0) await new Promise((r) => setTimeout(r, gapMs))
  }
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
