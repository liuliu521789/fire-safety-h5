<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { setBgmEnabled, tryAutoplayBgm, unlockBgmFromGesture } from '@/utils/bgm'

const game = useGameStore()

function onUserGesture() {
  if (!game.soundEnabled) return
  unlockBgmFromGesture()
}

onMounted(() => {
  game.hydrate()
  setBgmEnabled(game.soundEnabled)

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
</script>

<template>
  <div class="app-root">
    <RouterView />
  </div>
</template>

<style scoped>
.app-root {
  position: relative;
  width: 100%;
  min-height: 100dvh;
}
</style>
