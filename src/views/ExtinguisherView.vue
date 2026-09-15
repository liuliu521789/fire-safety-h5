<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FireEffect from '@/components/FireEffect.vue'
import GameButton from '@/components/GameButton.vue'
import GameCoachBanner from '@/components/GameCoachBanner.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import { useGameStore } from '@/stores/game'
import { clamp } from '@/utils/game'
import { playTone } from '@/utils/sound'

const FLAME_ROOT = { x: 68, y: 62 }
const AIM_OK = 13
const STEPS = [
  { n: 1, name: '提', title: '提起灭火器', tip: '点击灭火器，准备投入灭火' },
  { n: 2, name: '拔', title: '拔掉保险销', tip: '按住保险销向右滑动拔出' },
  { n: 3, name: '握', title: '握住喷管对准', tip: '拖动喷管，对准火焰根部（底部）' },
  { n: 4, name: '压', title: '压下阀门喷射', tip: '按住喷射按钮，持续喷射直至扑灭' },
] as const

const router = useRouter()
const game = useGameStore()

const step = ref(1)
const tip = ref<string>(STEPS[0].tip)
const tipTone = ref<'ok' | 'warn' | 'bad'>('ok')
const flame = ref(1)
const spraying = ref(false)
const nozzle = ref({ x: 42, y: 58 })
const aiming = ref(false)
const pinPulled = ref(false)
const pinDragX = ref(0)
const pinSwiping = ref(false)
const picked = ref(false)
const aligned = ref(false)
const alignHold = ref(0)
const done = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const sceneRef = ref<HTMLElement | null>(null)

let pinStartX = 0
let sprayTimer: number | null = null
let alignTimer: number | null = null
let raf = 0

const currentStep = computed(() => STEPS.find((s) => s.n === step.value) ?? STEPS[0])
const extinguishPct = computed(() => Math.round((1 - flame.value) * 100))
const coachIcon = computed(() => {
  if (tipTone.value === 'bad') return '⚠️'
  if (tipTone.value === 'warn') return '👉'
  if (step.value === 1) return '🧯'
  if (step.value === 2) return '➡️'
  if (step.value === 3) return '🎯'
  return '🤚'
})

function setTip(text: string, tone: 'ok' | 'warn' | 'bad' = 'ok') {
  tip.value = text
  tipTone.value = tone
}

function pickExtinguisher() {
  if (step.value !== 1 || picked.value) return
  picked.value = true
  playTone('click', game.soundEnabled)
  step.value = 2
  setTip(STEPS[1].tip, 'ok')
}

function onPinDown(e: PointerEvent) {
  if (step.value !== 2 || pinPulled.value) return
  e.preventDefault()
  pinSwiping.value = true
  pinStartX = e.clientX
  pinDragX.value = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPinMove(e: PointerEvent) {
  if (!pinSwiping.value || step.value !== 2 || pinPulled.value) return
  const delta = e.clientX - pinStartX
  pinDragX.value = Math.max(0, Math.min(72, delta))
  if (delta >= 40) pullPin(e)
}

function onPinUp(e: PointerEvent) {
  if (!pinSwiping.value) return
  const delta = e.clientX - pinStartX
  pinSwiping.value = false
  if (delta >= 40 && step.value === 2 && !pinPulled.value) {
    pullPin(e)
    return
  }
  pinDragX.value = 0
  setTip('请按住保险销，向右滑动拔出', 'warn')
}

function pullPin(e?: PointerEvent) {
  if (pinPulled.value || step.value !== 2) return
  pinPulled.value = true
  pinSwiping.value = false
  pinDragX.value = 72
  if (e) {
    try {
      ;(e.currentTarget as HTMLElement | null)?.releasePointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }
  }
  playTone('correct', game.soundEnabled)
  step.value = 3
  setTip(STEPS[2].tip, 'ok')
}

function scenePoint(e: PointerEvent) {
  const scene = sceneRef.value
  if (!scene) return null
  const rect = scene.getBoundingClientRect()
  return {
    x: clamp(((e.clientX - rect.left) / rect.width) * 100, 18, 92),
    y: clamp(((e.clientY - rect.top) / rect.height) * 100, 18, 88),
  }
}

function checkAligned(pos = nozzle.value) {
  return Math.hypot(pos.x - FLAME_ROOT.x, pos.y - FLAME_ROOT.y) < AIM_OK
}

function clearAlignTimer() {
  if (alignTimer != null) {
    window.clearInterval(alignTimer)
    alignTimer = null
  }
  alignHold.value = 0
}

function onNozzleDown(e: PointerEvent) {
  if (step.value !== 3 && step.value !== 4) return
  if (step.value === 4 && spraying.value) return
  aiming.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  const p = scenePoint(e)
  if (p) nozzle.value = p
}

function onNozzleMove(e: PointerEvent) {
  if (!aiming.value) return
  if (step.value !== 3 && step.value !== 4) return
  const p = scenePoint(e)
  if (!p) return
  nozzle.value = p
  const ok = checkAligned(p)
  aligned.value = ok
  if (step.value === 3) {
    if (ok) {
      setTip('已对准火焰根部，保持片刻…', 'ok')
      if (alignTimer == null) {
        alignTimer = window.setInterval(() => {
          if (!checkAligned()) {
            alignHold.value = 0
            return
          }
          alignHold.value = Math.min(100, alignHold.value + 12)
          if (alignHold.value >= 100) confirmAim()
        }, 80)
      }
    } else {
      clearAlignTimer()
      setTip('对准火焰底部（根部），不要只喷火苗尖端', 'warn')
    }
  }
}

function onNozzleUp() {
  aiming.value = false
  if (step.value === 3 && alignHold.value > 0 && alignHold.value < 100) {
    // keep hold progress if still aligned; only nudge if drifted off
    if (!checkAligned()) {
      clearAlignTimer()
      setTip('再试一次：把喷管拖到火焰根部光圈内', 'warn')
    }
    return
  }
  if (step.value === 3 && !aligned.value) {
    clearAlignTimer()
    setTip('再试一次：把喷管拖到火焰根部光圈内', 'warn')
  }
}

function confirmAim() {
  if (step.value !== 3) return
  clearAlignTimer()
  aligned.value = true
  playTone('correct', game.soundEnabled)
  step.value = 4
  setTip('按住右侧红色喷射按钮灭火；可随时拖动喷管微调方向', 'ok')
}

function startSpray(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (step.value !== 4 || done.value || spraying.value) return
  if (!checkAligned()) {
    aligned.value = false
    setTip('请先把喷管对准火焰根部，再按住喷射', 'bad')
    playTone('wrong', game.soundEnabled)
    return
  }
  spraying.value = true
  aligned.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  playTone('spray', game.soundEnabled)
  drawSpray()
  sprayTimer = window.setInterval(() => {
    if (!checkAligned()) {
      setTip('喷射偏离根部，请拖回对准后再喷', 'warn')
      stopSpray()
      playTone('wrong', game.soundEnabled)
      return
    }
    playTone('spray', game.soundEnabled)
    flame.value = Math.max(0, flame.value - 0.1)
    if (flame.value <= 0.05) finish()
  }, 160)
}

function stopSpray() {
  spraying.value = false
  if (sprayTimer !== null) {
    window.clearInterval(sprayTimer)
    sprayTimer = null
  }
  cancelAnimationFrame(raf)
  const ctx = canvasRef.value?.getContext('2d')
  if (ctx && canvasRef.value) ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

function drawSpray() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = (canvas.width = canvas.clientWidth * devicePixelRatio)
  const h = (canvas.height = canvas.clientHeight * devicePixelRatio)

  const loop = () => {
    if (!spraying.value) return
    ctx.clearRect(0, 0, w, h)
    const sx = (nozzle.value.x / 100) * w
    const sy = (nozzle.value.y / 100) * h
    const tx = (FLAME_ROOT.x / 100) * w
    const ty = (FLAME_ROOT.y / 100) * h
    for (let i = 0; i < 36; i++) {
      const t = Math.random()
      const x = sx + (tx - sx) * t + (Math.random() - 0.5) * 28
      const y = sy + (ty - sy) * t + (Math.random() - 0.5) * 20
      ctx.fillStyle = `rgba(210,230,255,${0.18 + Math.random() * 0.4})`
      ctx.beginPath()
      ctx.arc(x, y, 3 + Math.random() * 9, 0, Math.PI * 2)
      ctx.fill()
    }
    raf = requestAnimationFrame(loop)
  }
  loop()
}

function finish() {
  stopSpray()
  clearAlignTimer()
  if (done.value) return
  done.value = true
  step.value = 5
  setTip('灭火成功！记住口诀：提、拔、握、压', 'ok')
  game.extinguisherSuccess = true
  game.setLevelScore('extinguisher', 20)
  game.currentLevel = 4
  game.persist()
  playTone('success', game.soundEnabled)
}

function nextLevel() {
  router.push('/level/alarm')
}

const hoseStyle = computed(() => {
  const scene = sceneRef.value
  const x1Pct = picked.value ? 24 : 22
  const y1Pct = picked.value ? 50 : 54
  const x2Pct = nozzle.value.x
  const y2Pct = nozzle.value.y
  const w = scene?.clientWidth || 360
  const h = scene?.clientHeight || 400
  const x1 = (x1Pct / 100) * w
  const y1 = (y1Pct / 100) * h
  const x2 = (x2Pct / 100) * w
  const y2 = (y2Pct / 100) * h
  const len = Math.hypot(x2 - x1, y2 - y1)
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return {
    left: `${x1Pct}%`,
    top: `${y1Pct}%`,
    width: `${len}px`,
    transform: `rotate(${angle}deg)`,
  }
})

onUnmounted(() => {
  stopSpray()
  clearAlignTimer()
})
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="03" title="初起灭火" right-text="提拉握压" />
    <p class="mission-guide">按「提、拔、握、压」四步正确使用灭火器</p>
    <GameCoachBanner :text="tip" :tone="tipTone" :icon="coachIcon" />

    <div class="step-rail">
      <div
        v-for="s in STEPS"
        :key="s.n"
        class="step-item"
        :class="{ on: step === s.n, done: step > s.n }"
      >
        <b>{{ s.name }}</b>
        <span>{{ s.title }}</span>
      </div>
    </div>

    <div ref="sceneRef" class="ext-scene scene-panel">
      <div class="room-bg" aria-hidden="true">
        <div class="wall" />
        <div class="floor" />
        <div class="smoke-haze" />
      </div>

      <canvas ref="canvasRef" class="spray-layer" />

      <div class="trash-fire">
        <div class="bin" aria-hidden="true">
          <span class="bin-body" />
          <span class="bin-rim" />
        </div>
        <div
          class="flame-wrap"
          :style="{ opacity: Math.max(0.05, flame), transform: `scale(${0.65 + flame * 0.45})` }"
        >
          <FireEffect :intensity="1.15" />
        </div>
      </div>

      <div
        v-if="step >= 3 && !done"
        class="aim-target"
        :class="{ ok: aligned }"
        :style="{ left: `${FLAME_ROOT.x}%`, top: `${FLAME_ROOT.y}%` }"
      >
        <span>根部</span>
      </div>

      <div class="ext-unit" :class="{ picked }">
        <div
          v-if="step === 2"
          class="pin-zone"
          @pointerdown="onPinDown"
          @pointermove="onPinMove"
          @pointerup="onPinUp"
          @pointercancel="onPinUp"
        >
          <p class="pin-hint">按住黄销 · 向右滑 →</p>
          <div class="pin-track">
            <div class="pin-fill" :style="{ width: `${(pinDragX / 72) * 100}%` }" />
            <div
              class="pin"
              :class="{ pulled: pinPulled, swiping: pinSwiping }"
              :style="{ transform: `translate(calc(-50% + ${pinDragX}px), -50%)` }"
            >
              销
            </div>
          </div>
        </div>

        <button
          class="extinguisher"
          :class="{ pulse: step === 1 }"
          type="button"
          :disabled="step !== 1"
          :aria-label="step === 1 ? '点击拿起灭火器' : '灭火器'"
          @click="pickExtinguisher"
        >
          <span class="ext-emoji" aria-hidden="true">🧯</span>
        </button>
        <button
          v-if="step === 1"
          class="ext-cta"
          type="button"
          @click="pickExtinguisher"
        >
          点击拿起
        </button>
      </div>

      <div
        v-if="step >= 3"
        class="hose"
        :style="hoseStyle"
      />

      <div
        v-if="step >= 3"
        class="nozzle"
        :class="{ aligned, spraying, guide: step === 3 && !aligned }"
        :style="{ left: `${nozzle.x}%`, top: `${nozzle.y}%` }"
        @pointerdown="onNozzleDown"
        @pointermove="onNozzleMove"
        @pointerup="onNozzleUp"
        @pointercancel="onNozzleUp"
      >
        <span class="nozzle-head" />
        <span class="nozzle-label">{{ step === 3 ? '拖我对准' : '喷管' }}</span>
      </div>

      <button
        v-if="step === 4"
        class="spray-btn"
        :class="{ spraying, pulse: !spraying && !done }"
        type="button"
        @pointerdown="startSpray"
        @pointerup="stopSpray"
        @pointercancel="stopSpray"
      >
        <strong>按住喷射</strong>
        <span>{{ extinguishPct }}%</span>
      </button>

      <div v-if="step === 4 && !done" class="extinguish-bar" aria-hidden="true">
        <span>灭火进度</span>
        <i><b :style="{ width: `${extinguishPct}%` }" /></i>
      </div>

      <div v-if="step === 3 && alignHold > 0" class="align-bar">
        <i :style="{ width: `${alignHold}%` }" />
      </div>
    </div>

    <div class="ops">
      <p class="sub">当前步骤：{{ currentStep.name }} · {{ currentStep.title }}</p>
    </div>

    <GameModal v-if="done" title="灭火成功！">
      <p class="knowledge-tip">
        灭火器使用口诀「提、拔、握、压」：提起灭火器 → 拔掉保险销 → 握住喷管对准火焰根部 →
        压下阀门喷射。扑救初起火灾时也要注意自身安全，火势过大应立即撤离并报警。
      </p>
      <template #footer>
        <GameButton block label="进入下一关" @click="nextLevel" />
      </template>
    </GameModal>
  </div>
</template>

<style scoped>
.level {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(16px + var(--safe-bottom));
}

.mission {
  padding: 0 16px 8px;
  color: var(--assist-gray);
  font-size: 13px;
}

.step-rail {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 0 16px 10px;
}

.step-item {
  display: grid;
  gap: 2px;
  justify-items: center;
  padding: 8px 4px;
  border-radius: 12px;
  border: 1px solid rgba(143, 163, 184, 0.25);
  background: rgba(7, 26, 43, 0.45);
  color: var(--assist-gray);
}

.step-item b {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid rgba(143, 163, 184, 0.35);
  font-size: 14px;
}

.step-item span {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
}

.step-item.on {
  border-color: rgba(22, 119, 255, 0.55);
  background: rgba(22, 119, 255, 0.16);
  color: #d7e6ff;
}

.step-item.on b {
  border-color: var(--fire-blue);
  background: rgba(22, 119, 255, 0.35);
  color: #fff;
  box-shadow: 0 0 12px rgba(22, 119, 255, 0.35);
}

.step-item.done {
  border-color: rgba(67, 160, 71, 0.4);
  color: #a5d6a7;
}

.step-item.done b {
  border-color: #43a047;
  background: rgba(67, 160, 71, 0.28);
  color: #fff;
}

.ext-scene {
  position: relative;
  margin: 0 16px;
  height: min(52dvh, 450px);
  overflow: hidden;
  touch-action: none;
  border: 1px solid rgba(22, 119, 255, 0.28);
  background: #101b2a;
}

.room-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wall {
  position: absolute;
  inset: 0 0 38% 0;
  background:
    linear-gradient(180deg, #243448, #1a2838),
    repeating-linear-gradient(
      90deg,
      transparent 0 26px,
      rgba(255, 255, 255, 0.03) 26px 27px
    );
}

.floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 42%;
  background:
    linear-gradient(180deg, rgba(20, 32, 48, 0.2), rgba(8, 14, 22, 0.85)),
    repeating-linear-gradient(
      90deg,
      #1b2a3c 0 18px,
      #162233 18px 36px
    );
}

.smoke-haze {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 68% 58%, rgba(229, 57, 53, 0.22), transparent 42%);
}

.spray-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 6;
}

.trash-fire {
  position: absolute;
  left: 68%;
  top: 58%;
  width: 120px;
  height: 140px;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.bin {
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  width: 54px;
  height: 58px;
}

.bin-body {
  position: absolute;
  inset: 10px 4px 0;
  border-radius: 6px 6px 10px 10px;
  background: linear-gradient(180deg, #5d6d7e, #3d4a57);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.08);
}

.bin-rim {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(180deg, #8fa3b8, #607080);
}

.flame-wrap {
  position: absolute;
  left: 50%;
  top: 18%;
  transform: translate(-50%, 0);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.aim-target {
  position: absolute;
  z-index: 3;
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px dashed rgba(255, 213, 74, 0.65);
  background: rgba(255, 213, 74, 0.1);
  display: grid;
  place-items: center;
  pointer-events: none;
  animation: aimPulse 1.2s ease-in-out infinite;
}

.aim-target.ok {
  border-color: #43a047;
  background: rgba(67, 160, 71, 0.18);
  color: #a5d6a7;
}

.aim-target span {
  font-size: 11px;
  font-weight: 700;
  color: #ffe082;
}

.aim-target.ok span {
  color: #c8e6c9;
}

.ext-unit {
  position: absolute;
  left: 22%;
  top: 48%;
  z-index: 4;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ext-unit.picked {
  left: 24%;
  top: 46%;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35));
}

.extinguisher {
  border: none;
  background: transparent;
  padding: 4px;
  line-height: 0;
  pointer-events: auto;
}

.extinguisher:disabled {
  opacity: 1;
  pointer-events: none;
}

.extinguisher.pulse .ext-emoji {
  animation: extPulse 1.1s ease-in-out infinite;
}

.ext-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 92px;
  font-size: 72px;
  line-height: 1;
  text-align: center;
  overflow: visible;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
  user-select: none;
  pointer-events: none;
}

.ext-cta {
  position: relative;
  z-index: 2;
  margin: 0;
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: rgba(22, 119, 255, 0.92);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.35);
  white-space: nowrap;
}

.hose {
  position: absolute;
  z-index: 3;
  height: 5px;
  transform-origin: 0 50%;
  border-radius: 999px;
  background: linear-gradient(90deg, #607d8b, #90a4ae);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
  pointer-events: none;
}

.pin-zone {
  width: 148px;
  z-index: 7;
  touch-action: none;
  display: grid;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(7, 26, 43, 0.9);
  border: 1.5px solid rgba(255, 213, 74, 0.65);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.3),
    0 0 16px rgba(255, 213, 74, 0.2);
}

.pin-hint {
  margin: 0;
  text-align: center;
  color: #ffe082;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  animation: pinHint 1.1s ease-in-out infinite;
}

.pin-track {
  position: relative;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 213, 74, 0.28);
  overflow: hidden;
}

.pin-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 213, 74, 0.55), rgba(255, 213, 74, 0.12));
}

.pin {
  position: absolute;
  left: 18%;
  top: 50%;
  min-width: 34px;
  height: 22px;
  display: grid;
  place-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(255, 213, 74, 0.35);
  border: 1px solid rgba(255, 213, 74, 0.8);
  box-shadow: 0 0 10px rgba(255, 213, 74, 0.28);
  font-size: 11px;
  font-weight: 800;
  color: var(--flame-yellow);
  touch-action: none;
  white-space: nowrap;
}

.pin.swiping {
  box-shadow: 0 0 16px rgba(255, 213, 74, 0.55);
}

.pin.pulled {
  opacity: 0.35;
  pointer-events: none;
}

.nozzle {
  position: absolute;
  z-index: 8;
  transform: translate(-50%, -50%);
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(22, 119, 255, 0.22);
  border: 2px solid rgba(22, 119, 255, 0.7);
  box-shadow: 0 0 14px rgba(22, 119, 255, 0.35);
  display: grid;
  place-items: center;
  touch-action: none;
}

.nozzle.aligned {
  border-color: #43a047;
  background: rgba(67, 160, 71, 0.22);
  box-shadow: 0 0 16px rgba(67, 160, 71, 0.4);
}

.nozzle.guide {
  animation: nozzleGuide 1.1s ease-in-out infinite;
}

.nozzle.spraying {
  transform: translate(-50%, -50%) scale(1.06);
}

.nozzle-head {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #eceff1;
  box-shadow: inset 0 0 0 3px #546e7a;
}

.nozzle-label {
  position: absolute;
  top: calc(100% + 4px);
  font-size: 11px;
  font-weight: 700;
  color: #d7e6ff;
  white-space: nowrap;
}

.spray-btn {
  position: absolute;
  right: 12px;
  bottom: 14px;
  z-index: 9;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  background: radial-gradient(circle at 35% 30%, #ff8a80, #e53935 55%, #b71c1c);
  box-shadow:
    0 8px 22px rgba(229, 57, 53, 0.45),
    inset 0 0 0 3px rgba(0, 0, 0, 0.15);
  color: #fff;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  touch-action: none;
}

.spray-btn.pulse {
  animation: sprayPulse 1.15s ease-in-out infinite;
}

.spray-btn:active {
  transform: scale(0.96);
}

.spray-btn strong {
  font-size: 14px;
}

.spray-btn span {
  font-size: 12px;
  opacity: 0.9;
}

.align-bar {
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 12px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  z-index: 7;
}

.align-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #43a047, #81c784);
}

.extinguish-bar {
  position: absolute;
  left: 12px;
  right: 116px;
  bottom: 18px;
  z-index: 7;
  display: grid;
  gap: 4px;
  pointer-events: none;
}

.extinguish-bar span {
  font-size: 11px;
  font-weight: 700;
  color: #ffe082;
}

.extinguish-bar i {
  display: block;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.extinguish-bar b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #29b6f6, #81d4fa);
  transition: width 0.15s linear;
}

.spray-btn.spraying,
.spray-btn:active {
  transform: scale(0.96);
  box-shadow:
    0 4px 14px rgba(229, 57, 53, 0.55),
    inset 0 0 0 3px rgba(0, 0, 0, 0.2);
}

.ops {
  margin-top: 12px;
  padding: 0 16px;
}

.sub {
  margin-top: 0;
  color: #b8c9db;
  font-size: 13px;
  font-weight: 600;
}

@keyframes pinHint {
  50% {
    transform: translateX(4px);
    opacity: 0.7;
  }
}

@keyframes extPulse {
  50% {
    transform: scale(1.06);
    filter: brightness(1.1);
  }
}

@keyframes nozzleGuide {
  0%,
  100% {
    box-shadow: 0 0 14px rgba(22, 119, 255, 0.35);
  }
  50% {
    box-shadow: 0 0 22px rgba(255, 213, 74, 0.55);
    border-color: rgba(255, 213, 74, 0.85);
  }
}

@keyframes sprayPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 22px rgba(229, 57, 53, 0.45);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 10px 28px rgba(255, 213, 74, 0.45);
  }
}

@keyframes aimPulse {
  50% {
    transform: translate(-50%, -50%) scale(1.08);
    opacity: 0.85;
  }
}
</style>
