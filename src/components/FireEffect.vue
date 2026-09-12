<script setup lang="ts">
defineProps<{
  intensity?: number
}>()
</script>

<template>
  <div class="fire" :style="{ '--i': intensity ?? 1 }">
    <span class="core" />
    <span class="mid" />
    <span class="outer" />
    <span class="spark s1" />
    <span class="spark s2" />
  </div>
</template>

<style scoped>
.fire {
  position: relative;
  width: calc(42px * var(--i));
  height: calc(56px * var(--i));
  filter: drop-shadow(0 0 10px rgba(255, 138, 0, 0.55));
}

.core,
.mid,
.outer {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-radius: 50% 50% 45% 45%;
  animation: flicker 0.45s ease-in-out infinite alternate;
}

.outer {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 70%, #ff8a00, transparent 70%);
}

.mid {
  width: 68%;
  height: 78%;
  background: radial-gradient(circle at 50% 70%, #ffd54a, #e53935 70%, transparent);
  animation-delay: 0.08s;
}

.core {
  width: 34%;
  height: 48%;
  background: radial-gradient(circle at 50% 60%, #fff6c8, #ffd54a 70%, transparent);
  animation-delay: 0.14s;
}

.spark {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffd54a;
  animation: rise 1.1s linear infinite;
}

.s1 {
  left: 30%;
  bottom: 40%;
}

.s2 {
  left: 62%;
  bottom: 55%;
  animation-delay: 0.35s;
}

@keyframes flicker {
  from {
    transform: translateX(-50%) scale(1) rotate(-2deg);
  }
  to {
    transform: translateX(-50%) scale(1.06) rotate(2deg);
  }
}

@keyframes rise {
  0% {
    opacity: 0.9;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-28px);
  }
}
</style>
