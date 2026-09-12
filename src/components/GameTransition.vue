<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    duration?: number
  }>(),
  { duration: 450 },
)

const emit = defineEmits<{ done: [] }>()
const active = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    active.value = true
  })
  window.setTimeout(() => emit('done'), props.duration)
})
</script>

<template>
  <div class="transition-mask" :class="{ active }" />
</template>

<style scoped>
.transition-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%, rgba(22, 119, 255, 0.25), transparent 45%),
    rgba(2, 10, 18, 0.92);
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 0.35s ease, transform 0.45s ease;
}

.transition-mask.active {
  opacity: 1;
  transform: scale(1);
}
</style>
