<script setup lang="ts">
defineProps<{
  density?: number
}>()
</script>

<template>
  <div class="smoke" aria-hidden="true">
    <span v-for="n in density || 5" :key="n" class="puff" :style="{ '--n': n }" />
  </div>
</template>

<style scoped>
.smoke {
  pointer-events: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.puff {
  position: absolute;
  bottom: -10%;
  left: calc(8% + var(--n) * 15%);
  width: calc(70px + var(--n) * 8px);
  height: calc(70px + var(--n) * 8px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(180, 196, 214, 0.22), transparent 70%);
  filter: blur(2px);
  animation: drift calc(7s + var(--n) * 0.6s) ease-in-out infinite;
  animation-delay: calc(var(--n) * -1.1s);
}

@keyframes drift {
  0% {
    transform: translate3d(0, 10%, 0) scale(0.8);
    opacity: 0;
  }
  20% {
    opacity: 0.55;
  }
  100% {
    transform: translate3d(20px, -110%, 0) scale(1.35);
    opacity: 0;
  }
}
</style>
