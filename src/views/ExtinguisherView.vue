<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FireEffect from '@/components/FireEffect.vue'
import GameButton from '@/components/GameButton.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import { useGameStore } from '@/stores/game'
import { clamp } from '@/utils/game'
import { playTone } from '@/utils/sound'

const router = useRouter()
const game = useGameStore()

const step = ref(1)
const tip = ref('第一步：点击灭火器')
const flame = ref(1)
const spraying = ref(false)
const nozzle = ref({ x: 68, y: 48 })
const aiming = ref(false)
const pinPulled = ref(false)
const pinDragY = ref(0)
const pinSwiping = ref(false)
const done = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let pinStartY = 0
let sprayTimer: number | null = null
let raf = 0

const stepText = computed(() => {
  switch (step.value) {
    case 1:
      return '点击灭火器'
    case 2:
      return '向上滑动拔掉保险销'
    case 3:
      return '拖动喷嘴对准火焰根部'
    case 4:
      return '长按屏幕喷射'
    default:
      return '灭火成功'
  }
})

function pickExtinguisher() {
  if (step.value !== 1) return
  playTone('click', game.soundEnabled)
  step.value = 2
  tip.value = '第二步：向上滑动拔掉保险销'
}

function onPinDown(e: PointerEvent) {
  if (step.value !== 2 || pinPulled.value) return
  e.preventDefault()
  pinSwiping.value = true
  pinStartY = e.clientY
  pinDragY.value = 0
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPinMove(e: PointerEvent) {
  if (!pinSwiping.value || step.value !== 2 || pinPulled.value) return
  const delta = pinStartY - e.clientY
  pinDragY.value = Math.max(0, Math.min(72, delta))
  if (delta >= 28) {
    pullPin(e)
  }
}

function onPinUp(e: PointerEvent) {
  if (!pinSwiping.value) return
  const delta = pinStartY - e.clientY
  pinSwiping.value = false
  if (delta >= 28 && step.value === 2 && !pinPulled.value) {
    pullPin(e)
    return
  }
  pinDragY.value = 0
}

function pullPin(e?: PointerEvent) {
  if (pinPulled.value || step.value !== 2) return
  pinPulled.value = true
  pinSwiping.value = false
  pinDragY.value = 64
  if (e) {
    try {
      ;(e.currentTarget as HTMLElement | null)?.releasePointerCapture?.(e.pointerId)
    } catch {
      // already released
    }
  }
  playTone('correct', game.soundEnabled)
  step.value = 3
  tip.value = '第三步：拖动喷嘴对准火焰根部'
}

function onNozzleDown(e: PointerEvent) {
  if (step.value !== 3) return
  aiming.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onNozzleMove(e: PointerEvent) {
  if (!aiming.value || step.value !== 3) return
  const scene = document.querySelector('.ext-scene') as HTMLElement | null
  if (!scene) return
  const rect = scene.getBoundingClientRect()
  nozzle.value = {
    x: clamp(((e.clientX - rect.left) / rect.width) * 100, 20, 90),
    y: clamp(((e.clientY - rect.top) / rect.height) * 100, 20, 85),
  }
}

function onNozzleUp() {
  if (!aiming.value) return
  aiming.value = false
  // flame root around x:52 y:62
  const aligned = Math.hypot(nozzle.value.x - 52, nozzle.value.y - 62) < 14
  if (aligned) {
    playTone('correct', game.soundEnabled)
    step.value = 4
    tip.value = '第四步：长按屏幕喷射灭火剂'
  } else {
    tip.value = '尝试对准火焰根部。'
    playTone('wrong', game.soundEnabled)
  }
}

function startSpray() {
  if (step.value !== 4 || done.value) return
  const aligned = Math.hypot(nozzle.value.x - 52, nozzle.value.y - 62) < 16
  if (!aligned) {
    tip.value = '调整喷射方向，对准火焰根部。'
    playTone('wrong', game.soundEnabled)
    return
  }
  spraying.value = true
  playTone('spray', game.soundEnabled)
  drawSpray()
  sprayTimer = window.setInterval(() => {
    playTone('spray', game.soundEnabled)
    flame.value = Math.max(0, flame.value - 0.12)
    if (flame.value <= 0.05) {
      finish()
    }
  }, 180)
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
    const tx = 0.52 * w
    const ty = 0.62 * h
    for (let i = 0; i < 28; i++) {
      const t = Math.random()
      const x = sx + (tx - sx) * t + (Math.random() - 0.5) * 24
      const y = sy + (ty - sy) * t + (Math.random() - 0.5) * 18
      ctx.fillStyle = `rgba(210,230,255,${0.15 + Math.random() * 0.35})`
      ctx.beginPath()
      ctx.arc(x, y, 4 + Math.random() * 8, 0, Math.PI * 2)
      ctx.fill()
    }
    raf = requestAnimationFrame(loop)
  }
  loop()
}

function finish() {
  stopSpray()
  if (done.value) return
  done.value = true
  step.value = 5
  tip.value = '灭火成功！'
  game.extinguisherSuccess = true
  game.setLevelScore('extinguisher', 20)
  game.currentLevel = 4
  game.persist()
  playTone('success', game.soundEnabled)
}

function nextLevel() {
  router.push('/level/alarm')
}

onUnmounted(stopSpray)
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="03" title="初起灭火" right-text="四步操作" />
    <p class="mission">正确使用灭火器扑灭初起火灾</p>

    <div class="ext-scene scene-panel">
      <canvas ref="canvasRef" class="spray-layer" />
      <div class="bin">🗑</div>
      <div class="flame-wrap" :style="{ opacity: flame, transform: `scale(${0.7 + flame * 0.4})` }">
        <FireEffect :intensity="1.1" />
      </div>

      <button
        class="extinguisher"
        :class="{ active: step >= 1, idle: step !== 1 }"
        type="button"
        :disabled="step !== 1"
        @click="pickExtinguisher"
      >
        🧯
      </button>

      <div
        v-if="step === 2"
        class="pin-zone"
        @pointerdown="onPinDown"
        @pointermove="onPinMove"
        @pointerup="onPinUp"
        @pointercancel="onPinUp"
      >
        <div
          class="pin"
          :class="{ pulled: pinPulled, swiping: pinSwiping }"
          :style="{ transform: `translate(-50%, calc(-50% - ${pinDragY}px))` }"
        >
          保险销
        </div>
        <p class="pin-hint">↑ 按住向上滑动拔销</p>
      </div>

      <div v-else-if="step > 2 && pinPulled" class="pin pulled static">保险销</div>

      <div
        v-if="step >= 3"
        class="nozzle"
        :style="{ left: `${nozzle.x}%`, top: `${nozzle.y}%` }"
        @pointerdown="onNozzleDown"
        @pointermove="onNozzleMove"
        @pointerup="onNozzleUp"
      >
        喷嘴
      </div>

      <div
        v-if="step === 4"
        class="spray-zone"
        @pointerdown.prevent="startSpray"
        @pointerup="stopSpray"
        @pointercancel="stopSpray"
        @pointerleave="stopSpray"
      />
    </div>

    <div class="ops">
      <div class="steps">
        <span v-for="n in 4" :key="n" :class="{ on: step >= n }">{{ n }}</span>
      </div>
      <p>{{ tip }}</p>
      <p class="sub">{{ stepText }}</p>
    </div>

    <GameModal v-if="done" title="灭火成功！">
      <p class="knowledge-tip">
        发现初起火灾，在确保自身安全的情况下，可使用适当灭火器材进行扑救。
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
  padding: 0 16px 10px;
  color: var(--assist-gray);
  font-size: 13px;
}

.ext-scene {
  position: relative;
  margin: 0 16px;
  height: min(52dvh, 420px);
  overflow: hidden;
  touch-action: none;
  background:
    radial-gradient(circle at 52% 70%, rgba(229, 57, 53, 0.2), transparent 40%),
    linear-gradient(180deg, #15283c, #0a1828);
}

.spray-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

.bin {
  position: absolute;
  left: 52%;
  top: 68%;
  transform: translate(-50%, -50%);
  font-size: 42px;
}

.flame-wrap {
  position: absolute;
  left: 52%;
  top: 54%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 2;
}

.extinguisher {
  position: absolute;
  left: 18%;
  top: 58%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  filter: drop-shadow(0 0 12px rgba(22, 119, 255, 0.45));
  z-index: 2;
}

.extinguisher.idle {
  pointer-events: none;
}

.pin-zone {
  position: absolute;
  left: 2%;
  top: 28%;
  width: 36%;
  height: 42%;
  z-index: 6;
  touch-action: none;
  cursor: grab;
}

.pin-zone:active {
  cursor: grabbing;
}

.pin {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translate(-50%, -50%);
  min-width: 72px;
  min-height: 40px;
  display: grid;
  place-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 213, 74, 0.2);
  border: 1px solid rgba(255, 213, 74, 0.55);
  box-shadow: 0 0 16px rgba(255, 213, 74, 0.25);
  font-size: 13px;
  font-weight: 700;
  color: var(--flame-yellow);
  touch-action: none;
  transition: opacity 0.25s ease;
}

.pin.swiping {
  box-shadow: 0 0 20px rgba(255, 213, 74, 0.55);
}

.pin.pulled,
.pin.pulled.static {
  opacity: 0.35;
  pointer-events: none;
}

.pin.static {
  position: absolute;
  left: 18%;
  top: 28%;
  transform: translate(-50%, -50%);
}

.pin-hint {
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  width: max-content;
  color: #ffd7a8;
  font-size: 12px;
  animation: pinHint 1s ease-in-out infinite;
}

@keyframes pinHint {
  50% {
    transform: translate(-50%, -6px);
    opacity: 0.65;
  }
}

.nozzle {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -50%);
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(22, 119, 255, 0.25);
  border: 1px solid rgba(22, 119, 255, 0.6);
  font-size: 12px;
  font-weight: 700;
}

.spray-zone {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.ops {
  margin-top: 14px;
  padding: 0 16px;
}

.steps {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.steps span {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 1px solid rgba(143, 163, 184, 0.35);
  color: var(--assist-gray);
  font-size: 12px;
}

.steps span.on {
  border-color: var(--fire-blue);
  background: rgba(22, 119, 255, 0.25);
  color: var(--white);
}

.sub {
  margin-top: 4px;
  color: var(--assist-gray);
  font-size: 12px;
}
</style>
