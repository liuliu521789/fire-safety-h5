<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  value: number | string
  text?: string
}>()

const show = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    show.value = true
  })
  window.setTimeout(() => {
    show.value = false
  }, 1100)
})
</script>

<template>
  <div class="score-popup" :class="{ show }">
    <div class="value">+{{ value }}</div>
    <div v-if="text" class="text">{{ text }}</div>
  </div>
</template>

<style scoped>
.score-popup {
  pointer-events: none;
  position: absolute;
  left: 50%;
  top: 42%;
  transform: translate(-50%, 12px) scale(0.9);
  opacity: 0;
  z-index: 30;
  text-align: center;
  transition: all 0.45s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.score-popup.show {
  opacity: 1;
  transform: translate(-50%, -20px) scale(1);
}

.value {
  font-size: 42px;
  font-weight: 900;
  color: var(--flame-yellow);
  text-shadow: 0 0 24px rgba(255, 213, 74, 0.55);
}

.text {
  margin-top: 4px;
  color: #d7e6ff;
  font-size: 13px;
}
</style>
