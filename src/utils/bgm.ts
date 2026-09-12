/** 全游戏背景音乐：页面加载后尽量自动播放，失败则等用户点击 */

let audio: HTMLAudioElement | null = null
let wanted = true
let unlocked = false
let ducked = false

const BGM_VOLUME = 0.25
const BGM_DUCK_VOLUME = 0.05

function applyVolume() {
  if (!audio) return
  audio.volume = ducked ? BGM_DUCK_VOLUME : BGM_VOLUME
}

function getAudio() {
  if (!audio) {
    audio = new Audio(`${import.meta.env.BASE_URL}audio/bg.mp3`)
    audio.loop = true
    audio.preload = 'metadata'
    audio.volume = BGM_VOLUME
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
  }
  return audio
}

async function playInternal(): Promise<boolean> {
  if (!wanted) return false
  const el = getAudio()
  try {
    applyVolume()
    await el.play()
    unlocked = true
    return true
  } catch {
    return false
  }
}

export function stopBgm() {
  if (!audio) return
  try {
    audio.pause()
    audio.currentTime = 0
  } catch {
    // ignore
  }
}

/** 语音播报时压低 BGM，避免盖住接警语音 */
export function setBgmDucked(next: boolean) {
  ducked = next
  applyVolume()
}

export function setBgmEnabled(enabled: boolean) {
  wanted = enabled
  if (!enabled) {
    stopBgm()
    return
  }
  if (unlocked) void playInternal()
}

export function isBgmWanted() {
  return wanted
}

export function isBgmPlaying() {
  return !!audio && !audio.paused
}

/** 页面加载后尝试自动播放；成功返回 true */
export async function tryAutoplayBgm(): Promise<boolean> {
  if (!wanted) return false
  return playInternal()
}

/** 用户手势中调用，保证可播放 */
export function unlockBgmFromGesture() {
  unlocked = true
  if (!wanted) return
  void playInternal()
}
