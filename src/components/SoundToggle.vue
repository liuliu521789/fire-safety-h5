<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { unlockBgmFromGesture } from '@/utils/bgm'
import { playTone } from '@/utils/sound'

const game = useGameStore()

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
  <button
    class="sound-toggle"
    type="button"
    :title="game.soundEnabled ? '关闭声音' : '开启声音'"
    :aria-label="game.soundEnabled ? '关闭声音' : '开启声音'"
    @click.stop="toggleSound"
  >
    {{ game.soundEnabled ? '🔊' : '🔇' }}
  </button>
</template>

<style scoped>
.sound-toggle {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(22, 119, 255, 0.35);
  background: rgba(7, 26, 43, 0.78);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
  font-size: 16px;
  line-height: 1;
  display: grid;
  place-items: center;
  -webkit-tap-highlight-color: transparent;
}
</style>
