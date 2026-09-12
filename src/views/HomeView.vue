<script setup lang="ts">
import gsap from 'gsap'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameTransition from '@/components/GameTransition.vue'
import SoundToggle from '@/components/SoundToggle.vue'
import { useGameStore } from '@/stores/game'
import { assetUrl } from '@/utils/assets'
import { playTone } from '@/utils/sound'
import { unlockBgmFromGesture } from '@/utils/bgm'

/**
 * 热区坐标基于背景图 940×1672，百分比相对图片可视区域。
 * 图中「开始行动」按钮约在下部居中。
 */
const HOTSPOTS = [
  {
    id: 'start',
    label: '开始行动',
    left: 18,
    top: 78.7,
    width: 64,
    height: 12.5,
    action: 'start' as const,
  },
]

const EMBERS = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  left: 10 + ((i * 13) % 80),
  delay: (i % 5) * 0.45,
  duration: 5 + (i % 4) * 0.8,
  size: 3 + (i % 3),
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 3),
}))

const router = useRouter()
const game = useGameStore()
const stageRef = ref<HTMLElement | null>(null)
const transitioning = ref(false)
const pressedId = ref<string | null>(null)
const ready = ref(false)
const homeBgWebp = assetUrl('homebg.webp')
const homeBgJpg = assetUrl('homebg.jpg')
let enterTween: gsap.core.Timeline | null = null

onMounted(async () => {
  await nextTick()
  ready.value = true
  // 预取第一关场景图，进入关卡时更快
  ;['images/hazard-home.webp', 'images/hazard-home.jpg'].forEach((p) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = assetUrl(p)
    document.head.appendChild(link)
  })
  if (!stageRef.value) return
  enterTween = gsap.timeline({ defaults: { ease: 'power2.out' } })
  enterTween
    .from(stageRef.value, { opacity: 0, scale: 1.03, duration: 0.55 })
    .from('.fx-layer', { opacity: 0, duration: 0.4 }, '-=0.25')
    .from('.hotspot', { opacity: 0, scale: 0.95, duration: 0.35 }, '-=0.2')
})

onUnmounted(() => {
  enterTween?.kill()
})

function onHotspot(action: 'start') {
  if (transitioning.value) return
  if (action === 'start') {
    unlockBgmFromGesture()
    playTone('alarm', game.soundEnabled)
    if (stageRef.value) {
      gsap.fromTo(
        '.hotspot-glow',
        { opacity: 0.35, scale: 0.95 },
        { opacity: 0.9, scale: 1.08, duration: 0.28, yoyo: true, repeat: 1 },
      )
      gsap.to(stageRef.value, { scale: 0.985, duration: 0.18, yoyo: true, repeat: 1 })
    }
    game.startGame()
    transitioning.value = true
  }
}

function goLevel() {
  router.push('/level/hazard')
}
</script>

<template>
  <div class="home" :class="{ ready }">
    <div class="home-top">
      <SoundToggle />
    </div>
    <div ref="stageRef" class="stage">
      <picture class="bg-wrap">
        <source :srcset="homeBgWebp" type="image/webp" />
        <img class="bg" :src="homeBgJpg" alt="火线行动：消防安全知识挑战" draggable="false" decoding="async" fetchpriority="high" />
      </picture>

      <div class="fx-layer" aria-hidden="true">
        <div class="siren siren-red" />
        <div class="siren siren-blue" />
        <div class="scan" />
        <div class="heat-shimmer" />
        <span
          v-for="ember in EMBERS"
          :key="ember.id"
          class="ember"
          :style="{
            left: `${ember.left}%`,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            '--delay': `${ember.delay}s`,
            '--duration': `${ember.duration}s`,
            '--drift': `${ember.drift}px`,
          }"
        />
      </div>

      <button
        v-for="spot in HOTSPOTS"
        :key="spot.id"
        type="button"
        class="hotspot"
        :class="{ pressed: pressedId === spot.id }"
        :aria-label="spot.label"
        :style="{
          left: `${spot.left}%`,
          top: `${spot.top}%`,
          width: `${spot.width}%`,
          height: `${spot.height}%`,
        }"
        @pointerdown="pressedId = spot.id"
        @pointerup="pressedId = null"
        @pointercancel="pressedId = null"
        @pointerleave="pressedId = null"
        @click="onHotspot(spot.action)"
      >
        <span class="hotspot-glow" />
        <svg class="hotspot-shape" viewBox="0 0 320 72" preserveAspectRatio="none" aria-hidden="true">
          <!-- 贴合图中六边形「开始行动」按钮：仅脉冲，不常亮 -->
          <polygon
            class="hex-pulse"
            points="28,4 292,4 316,36 292,68 28,68 4,36"
          />
          <polygon
            class="hex-pulse hex-pulse-delay"
            points="28,4 292,4 316,36 292,68 28,68 4,36"
          />
        </svg>
        <span class="hotspot-shine" />
      </button>
    </div>

    <GameTransition v-if="transitioning" @done="goLevel" />
  </div>
</template>

<style scoped>
.home {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 100dvh;
  min-height: 100svh;
  overflow: hidden;
  background: #02080f;
}

.home-top {
  position: absolute;
  top: calc(10px + env(safe-area-inset-top, 0px));
  right: 12px;
  z-index: 6;
}

.stage {
  position: relative;
  width: min(100vw, calc(100dvh * 940 / 1672));
  height: min(100dvh, calc(100vw * 1672 / 940));
  max-width: 100%;
  max-height: 100dvh;
  max-height: 100svh;
  transform-origin: center center;
}

.bg-wrap,
.bg {
  display: block;
  width: 100%;
  height: 100%;
}

.bg {
  object-fit: fill;
  user-select: none;
  pointer-events: none;
  -webkit-user-drag: none;
}

.fx-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
}

.siren {
  position: absolute;
  top: 0;
  width: 42%;
  height: 100%;
  opacity: 0;
}

.siren-red {
  left: 0;
  background: radial-gradient(ellipse at 20% 45%, rgba(255, 48, 48, 0.28), transparent 62%);
  animation: sirenFlash 2s ease-in-out infinite;
}

.siren-blue {
  right: 0;
  background: radial-gradient(ellipse at 80% 48%, rgba(48, 140, 255, 0.24), transparent 62%);
  animation: sirenFlash 2s ease-in-out infinite 1s;
}

.scan {
  position: absolute;
  left: -10%;
  width: 120%;
  height: 18%;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(120, 200, 255, 0.06),
    rgba(255, 255, 255, 0.04),
    transparent
  );
  animation: scanMove 6.5s linear infinite;
}

.heat-shimmer {
  position: absolute;
  right: 4%;
  top: 28%;
  width: 36%;
  height: 34%;
  background: radial-gradient(circle, rgba(255, 120, 40, 0.12), transparent 70%);
  animation: heatPulse 2.8s ease-in-out infinite;
}

.ember {
  position: absolute;
  bottom: -4%;
  border-radius: 50%;
  background: radial-gradient(circle, #ffe08a 0%, #ff8a00 45%, transparent 75%);
  box-shadow: 0 0 8px rgba(255, 138, 0, 0.65);
  opacity: 0;
  animation: emberRise var(--duration) linear infinite;
  animation-delay: var(--delay);
}

.hotspot {
  position: absolute;
  z-index: 2;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  overflow: visible;
}

.hotspot-glow,
.hotspot-shape {
  position: absolute;
  inset: -8% -1.5%;
  pointer-events: none;
}

.hotspot-glow {
  background: radial-gradient(ellipse at center, rgba(80, 190, 255, 0.28), transparent 68%);
  clip-path: polygon(8.75% 0%, 91.25% 0%, 98.75% 50%, 91.25% 100%, 8.75% 100%, 1.25% 50%);
  animation: btnBreath 2.2s ease-in-out infinite;
}

.hotspot-shape {
  width: auto;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 0 6px rgba(90, 208, 255, 0.45));
}

.hex-pulse {
  fill: none;
  stroke: #7ad8ff;
  stroke-width: 2;
  stroke-linejoin: round;
  transform-origin: center;
  transform-box: fill-box;
  animation: hexPulse 2.4s ease-out infinite;
}

.hex-pulse-delay {
  animation-delay: 1.2s;
}

/* 扫光只贴按钮本体，不跟随放大后的热区外扩 */
.hotspot-shine {
  position: absolute;
  top: -2%;
  right: 16%;
  bottom: 38%;
  left: 6%;
  overflow: hidden;
  pointer-events: none;
  clip-path: polygon(8.75% 0%, 91.25% 0%, 98.75% 50%, 91.25% 100%, 8.75% 100%, 1.25% 50%);
}

.hotspot-shine::before {
  content: '';
  position: absolute;
  top: -40%;
  left: -50%;
  width: 38%;
  height: 180%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
  transform: skewX(-18deg);
  animation: btnShine 3.2s ease-in-out infinite;
}

.hotspot.pressed .hotspot-glow {
  opacity: 0.95;
  transform: scale(1.04);
}

.hotspot:focus-visible {
  outline: none;
}

.hotspot:focus-visible .hex-pulse {
  opacity: 1;
}

@keyframes sirenFlash {
  0%,
  45%,
  100% {
    opacity: 0.05;
  }
  55%,
  70% {
    opacity: 0.55;
  }
}

@keyframes scanMove {
  0% {
    top: -20%;
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.5;
  }
  100% {
    top: 110%;
    opacity: 0;
  }
}

@keyframes heatPulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.08);
  }
}

@keyframes emberRise {
  0% {
    transform: translate3d(0, 0, 0) scale(0.6);
    opacity: 0;
  }
  12% {
    opacity: 0.85;
  }
  100% {
    transform: translate3d(var(--drift), -110vh, 0) scale(0.2);
    opacity: 0;
  }
}

@keyframes btnBreath {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.04);
  }
}

@keyframes hexPulse {
  0% {
    opacity: 0.85;
    transform: scale(1);
  }
  70% {
    opacity: 0;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}

@keyframes btnShine {
  0%,
  55% {
    transform: translateX(0) skewX(-18deg);
    opacity: 0;
  }
  65% {
    opacity: 0.9;
  }
  100% {
    transform: translateX(320%) skewX(-18deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .siren,
  .scan,
  .heat-shimmer,
  .ember,
  .hotspot-glow,
  .hex-pulse,
  .hotspot-shine::before {
    animation: none !important;
  }
}
</style>
