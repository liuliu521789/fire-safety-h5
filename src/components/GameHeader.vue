<script setup lang="ts">
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
    <div v-if="rightText" class="right hud-chip">{{ rightText }}</div>
    <div v-else class="right">
      <slot name="right" />
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
  gap: 12px;
  min-height: var(--hud-height);
  padding: 10px 16px 8px;
}

.left {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
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
}
</style>
