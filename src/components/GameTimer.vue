<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { formatCountdown } from '@/utils/game'

const props = defineProps<{
  seconds: number
  running?: boolean
}>()

const emit = defineEmits<{ tick: [number]; timeout: [] }>()

const left = ref(props.seconds)
let timer: number | null = null

const display = computed(() => formatCountdown(left.value))
const urgent = computed(() => left.value <= 5)

function clear() {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

function start() {
  clear()
  if (!props.running) return
  timer = window.setInterval(() => {
    if (left.value <= 0) {
      clear()
      emit('timeout')
      return
    }
    left.value -= 1
    emit('tick', left.value)
    if (left.value <= 0) {
      clear()
      emit('timeout')
    }
  }, 1000)
}

watch(
  () => [props.seconds, props.running] as const,
  ([seconds, running]) => {
    left.value = seconds
    if (running) start()
    else clear()
  },
)

onMounted(() => {
  left.value = props.seconds
  if (props.running !== false) start()
})

onUnmounted(clear)

defineExpose({ left, reset: (s?: number) => { left.value = s ?? props.seconds } })
</script>

<template>
  <div class="timer hud-chip" :class="{ urgent }">
    <span class="dot" />
    <strong>{{ display }}</strong>
  </div>
</template>

<style scoped>
.timer {
  min-width: 72px;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.timer strong {
  color: var(--white);
}

.timer.urgent {
  border-color: rgba(229, 57, 53, 0.55);
  color: #ffb4b0;
  animation: pulse 0.8s ease-in-out infinite;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--fire-red);
  box-shadow: 0 0 8px var(--fire-red);
}

@keyframes pulse {
  50% {
    transform: scale(1.04);
  }
}
</style>
