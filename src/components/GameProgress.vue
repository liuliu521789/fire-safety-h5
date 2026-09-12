<script setup lang="ts">
defineProps<{
  current: number
  total: number
  label?: string
}>()
</script>

<template>
  <div class="progress hud-chip">
    <span>{{ label || '进度' }}</span>
    <strong>{{ current }} / {{ total }}</strong>
    <span class="bar">
      <i :style="{ width: `${Math.min(100, (current / Math.max(1, total)) * 100)}%` }" />
    </span>
  </div>
</template>

<style scoped>
.progress {
  gap: 8px;
}

strong {
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

.bar {
  position: relative;
  width: 54px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.bar i {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--fire-blue), var(--flame-yellow));
  border-radius: inherit;
  transition: width 0.25s ease;
}
</style>
