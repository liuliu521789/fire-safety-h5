<script setup lang="ts">
import SoundToggle from '@/components/SoundToggle.vue'

defineProps<{
  code: string
  title: string
  rightText?: string
}>()
</script>

<template>
  <header class="game-header">
    <div class="left">
      <span class="code">{{ code }}</span>
      <span class="slash">/</span>
      <span class="title">{{ title }}</span>
    </div>
    <div class="right">
      <div v-if="rightText" class="hud-chip">{{ rightText }}</div>
      <slot v-else name="right" />
      <SoundToggle />
    </div>
  </header>
</template>

<style scoped>
.game-header {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: var(--hud-height);
  padding: 10px 12px 8px 16px;
}

.left {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.code {
  color: var(--flame-yellow);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.slash {
  color: rgba(143, 163, 184, 0.6);
}

.title {
  color: var(--white);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
