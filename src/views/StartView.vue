<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SmokeEffect from '@/components/SmokeEffect.vue'
import { useGameStore } from '@/stores/game'
import { hasVisitedBefore, markVisited } from '@/utils/storage'
import { isBgmPlaying, tryAutoplayBgm, unlockBgmFromGesture } from '@/utils/bgm'
import { playTone } from '@/utils/sound'

const router = useRouter()
const game = useGameStore()
const ready = ref(false)
const needTap = ref(false)
let timer: number | null = null

function goHome() {
  router.replace('/home')
}

function enter() {
  unlockBgmFromGesture()
  if (!hasVisitedBefore()) {
    playTone('alarm', game.soundEnabled)
    markVisited()
  }
  goHome()
}

onMounted(async () => {
  game.hydrate()
  requestAnimationFrame(() => {
    ready.value = true
  })

  // 先尝试自动播放背景音
  let ok = false
  if (game.soundEnabled) {
    ok = await tryAutoplayBgm()
  }

  if (ok || isBgmPlaying()) {
    // 自动播放成功：短暂展示启动页后进入
    timer = window.setTimeout(() => {
      if (!hasVisitedBefore()) markVisited()
      goHome()
    }, 1400)
  } else {
    // 被浏览器拦截：提示点击后开启声音并进入
    needTap.value = true
  }
})

onUnmounted(() => {
  if (timer !== null) window.clearTimeout(timer)
})
</script>

<template>
  <div class="game-shell start" :class="{ ready, needTap }" @click="needTap && enter()">
    <SmokeEffect :density="6" />
    <div class="scan" />
    <div class="siren left" />
    <div class="siren right" />

    <div class="brand">
      <div class="flame">🔥</div>
      <h1>火线行动</h1>
      <h2>消防安全挑战</h2>
      <p>创意赋能 · 守护你我</p>
    </div>

    <div class="boot">
      <template v-if="needTap">点击屏幕开始体验</template>
      <template v-else>系统启动中…</template>
    </div>
  </div>
</template>

<style scoped>
.start {
  display: grid;
  place-items: center;
  text-align: center;
  cursor: default;
}

.start.needTap {
  cursor: pointer;
}

.scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  top: 18%;
  background: linear-gradient(90deg, transparent, rgba(22, 119, 255, 0.85), transparent);
  box-shadow: 0 0 18px rgba(22, 119, 255, 0.8);
  animation: scan 1.6s linear infinite;
}

.siren {
  position: absolute;
  top: 14%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  opacity: 0.2;
  animation: blink 0.7s ease-in-out infinite;
}

.siren.left {
  left: 18%;
  background: var(--fire-red);
  box-shadow: 0 0 18px var(--fire-red);
}

.siren.right {
  right: 18%;
  background: var(--fire-blue);
  box-shadow: 0 0 18px var(--fire-blue);
  animation-delay: 0.35s;
}

.brand {
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(10px);
  transition: 0.7s ease;
}

.start.ready .brand {
  opacity: 1;
  transform: none;
}

.flame {
  font-size: 42px;
  filter: drop-shadow(0 0 16px rgba(255, 138, 0, 0.7));
  animation: bob 1.2s ease-in-out infinite;
}

h1 {
  margin-top: 10px;
  font-size: 36px;
  letter-spacing: 0.12em;
}

h2 {
  margin-top: 6px;
  font-size: 18px;
  color: #d7e6ff;
  font-weight: 600;
}

p {
  margin-top: 14px;
  color: var(--assist-gray);
  letter-spacing: 0.18em;
  font-size: 12px;
}

.boot {
  position: absolute;
  bottom: calc(28px + var(--safe-bottom));
  color: var(--assist-gray);
  font-size: 12px;
  letter-spacing: 0.12em;
}

.start.needTap .boot {
  color: var(--flame-yellow);
  animation: blink 1.1s ease-in-out infinite;
}

@keyframes scan {
  from {
    top: 12%;
  }
  to {
    top: 86%;
  }
}

@keyframes blink {
  50% {
    opacity: 1;
  }
}

@keyframes bob {
  50% {
    transform: translateY(-4px) scale(1.05);
  }
}
</style>
