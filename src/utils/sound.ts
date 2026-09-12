type Tone = 'correct' | 'wrong' | 'alarm' | 'click' | 'success' | 'spray'

let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

function beep(freq: number, duration: number, type: OscillatorType, gain = 0.08) {
  const audio = getCtx()
  if (audio.state === 'suspended') void audio.resume()
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(audio.destination)
  const now = audio.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + duration)
  osc.start(now)
  osc.stop(now + duration)
}

export function playTone(kind: Tone, enabled = true) {
  if (!enabled) return
  try {
    switch (kind) {
      case 'click':
        beep(520, 0.06, 'square', 0.04)
        break
      case 'correct':
        beep(660, 0.1, 'sine', 0.07)
        setTimeout(() => beep(880, 0.12, 'sine', 0.07), 80)
        break
      case 'wrong':
        beep(220, 0.16, 'sawtooth', 0.05)
        break
      case 'alarm':
        beep(880, 0.12, 'square', 0.06)
        setTimeout(() => beep(620, 0.12, 'square', 0.06), 120)
        setTimeout(() => beep(880, 0.12, 'square', 0.06), 240)
        break
      case 'success':
        beep(523, 0.1, 'sine', 0.07)
        setTimeout(() => beep(659, 0.1, 'sine', 0.07), 100)
        setTimeout(() => beep(784, 0.18, 'sine', 0.08), 200)
        break
      case 'spray':
        beep(180, 0.08, 'triangle', 0.03)
        break
    }
  } catch {
    // Audio may be blocked until user gesture
  }
}
