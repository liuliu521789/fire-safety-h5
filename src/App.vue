<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { setBgmEnabled, tryAutoplayBgm, unlockBgmFromGesture } from '@/utils/bgm'
import { playTone } from '@/utils/sound'

const game = useGameStore()

function onUserGesture() {
  if (!game.soundEnabled) return
  unlockBgmFromGesture()
}

onMounted(() => {
  game.hydrate()
  setBgmEnabled(game.soundEnabled)

  // 加载完成后尝试自动播放（部分环境允许；被拦截则等点击）
  if (game.soundEnabled) {
    void tryAutoplayBgm()
  }

  window.addEventListener('pointerdown', onUserGesture, { passive: true })
  window.addEventListener('touchstart', onUserGesture, { passive: true })
  window.addEventListener('keydown', onUserGesture)
})

onUnmounted(() => {
  window.removeEventListener('pointerdown', onUserGesture)
  window.removeEventListener('touchstart', onUserGesture)
  window.removeEventListener('keydown', onUserGesture)
})

watch(
  () => game.soundEnabled,
  (enabled) => {
    setBgmEnabled(enabled)
    if (enabled) void tryAutoplayBgm()
  },
)

function toggleSound() {
  const next = !game.soundEnabled
  game.toggleSound()
  if (next) {
    unlockBgmFromGesture()
    playTone('click', true)
  }
}
</script>

<template>
  <div class="app-root">
    <RouterView />
    <button
      class="sound-toggle"
      type="button"
      :title="game.soundEnabled ? '关闭声音' : '开启声音'"
      :aria-label="game.soundEnabled ? '关闭声音' : '开启声音'"
      @click.stop="toggleSound"
    >
      {{ game.soundEnabled ? '🔊' : '🔇' }}
    </button>
  </div>
</template>

<style scoped>
.app-root {
  position: relative;
  width: 100%;
  min-height: 100dvh;
}

.sound-toggle {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 12px;
  z-index: 90;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(22, 119, 255, 0.35);
  background: rgba(7, 26, 43, 0.78);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
  font-size: 18px;
  line-height: 1;
}
</style>
