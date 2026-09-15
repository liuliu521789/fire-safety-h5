<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 最短展示时长（ms） */
    duration?: number
    /** 主文案 */
    title?: string
    /** 副文案 */
    subtitle?: string
    /** 可选：加载完成 Promise（与 duration 取较长者） */
    waitUntil?: Promise<unknown> | null
  }>(),
  {
    duration: 1400,
    title: '行动部署中',
    subtitle: '正在接入任务系统…',
    waitUntil: null,
  },
)

const emit = defineEmits<{ done: [] }>()

const active = ref(false)
const progress = ref(0)
const tipIndex = ref(0)
const tips = ['核对任务坐标', '同步关卡资源', '校准安全协议', '准备开始行动']

let raf = 0
let tipTimer = 0
let finished = false

const tip = computed(() => tips[tipIndex.value % tips.length])
const progressLabel = computed(() => `${Math.min(100, Math.round(progress.value))}%`)

function finish() {
  if (finished) return
  finished = true
  progress.value = 100
  window.setTimeout(() => emit('done'), 180)
}

onMounted(() => {
  requestAnimationFrame(() => {
    active.value = true
  })

  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    // ease-out，末段停在 92% 等真实资源
    progress.value = Math.min(92, 100 * (1 - Math.pow(1 - t, 2.2)))
    if (t < 1) {
      raf = requestAnimationFrame(tick)
    }
  }
  raf = requestAnimationFrame(tick)

  tipTimer = window.setInterval(() => {
    tipIndex.value += 1
  }, 420)

  const minWait = new Promise<void>((resolve) => {
    window.setTimeout(resolve, props.duration)
  })

  void Promise.all([minWait, props.waitUntil ?? Promise.resolve()]).then(finish)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.clearInterval(tipTimer)
})
</script>

<template>
  <div class="loading-mask" :class="{ active }" role="status" aria-live="polite" aria-busy="true">
    <div class="loading-panel">
      <div class="radar" aria-hidden="true">
        <span class="ring" />
        <span class="ring ring-2" />
        <span class="sweep" />
        <span class="core" />
      </div>

      <p class="title">{{ title }}</p>
      <p class="subtitle">{{ subtitle }}</p>

      <div class="bar-wrap">
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: `${progress}%` }" />
          <div class="bar-glow" :style="{ left: `${progress}%` }" />
        </div>
        <div class="bar-meta">
          <span class="tip">{{ tip }}</span>
          <span class="pct">{{ progressLabel }}</span>
        </div>
      </div>

      <p class="hint">请稍候，任务即将开始</p>
    </div>
  </div>
</template>

<style scoped>
.loading-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: calc(16px + var(--safe-top, 0px)) 20px calc(16px + var(--safe-bottom, 0px));
  background:
    radial-gradient(circle at 50% 38%, rgba(22, 119, 255, 0.28), transparent 42%),
    radial-gradient(circle at 80% 80%, rgba(229, 57, 53, 0.12), transparent 35%),
    rgba(2, 10, 18, 0.94);
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 0.35s ease, transform 0.45s ease;
  pointer-events: auto;
}

.loading-mask.active {
  opacity: 1;
  transform: scale(1);
}

.loading-panel {
  width: min(860px, 100%);
  max-width: 360px;
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
}

.radar {
  position: relative;
  width: 92px;
  height: 92px;
  margin-bottom: 4px;
  border-radius: 50%;
  border: 1px solid rgba(22, 119, 255, 0.45);
  background: radial-gradient(circle, rgba(22, 119, 255, 0.18), transparent 68%);
  box-shadow: 0 0 24px rgba(22, 119, 255, 0.25);
  overflow: hidden;
}

.ring {
  position: absolute;
  inset: 16%;
  border: 1px solid rgba(122, 216, 255, 0.35);
  border-radius: 50%;
}

.ring-2 {
  inset: 30%;
  border-color: rgba(122, 216, 255, 0.2);
}

.sweep {
  position: absolute;
  inset: 0;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(22, 119, 255, 0.55) 50deg, transparent 70deg);
  animation: sweep 1.4s linear infinite;
}

.core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7ad8ff;
  box-shadow: 0 0 12px #7ad8ff;
  transform: translate(-50%, -50%);
}

.title {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff;
}

.subtitle {
  margin: 0;
  font-size: 0.88rem;
  color: var(--assist-gray);
}

.bar-wrap {
  width: 100%;
  margin-top: 6px;
}

.bar-track {
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(22, 119, 255, 0.35);
}

.bar-fill {
  height: 100%;
  width: 0%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1677ff, #5ec8ff 55%, #ffd54a);
  box-shadow: 0 0 12px rgba(22, 119, 255, 0.55);
  transition: width 0.08s linear;
}

.bar-glow {
  position: absolute;
  top: -4px;
  width: 14px;
  height: 16px;
  margin-left: -7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 0 10px rgba(126, 220, 255, 0.9);
  pointer-events: none;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 0.78rem;
  color: rgba(200, 220, 240, 0.9);
}

.pct {
  font-variant-numeric: tabular-nums;
  color: #7ad8ff;
  font-weight: 600;
}

.hint {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: rgba(143, 163, 184, 0.85);
  letter-spacing: 0.04em;
}

@keyframes sweep {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-mask {
    transition: opacity 0.2s ease;
    transform: none;
  }

  .sweep {
    animation: none;
    opacity: 0.45;
  }

  .bar-fill {
    transition: none;
  }
}
</style>
