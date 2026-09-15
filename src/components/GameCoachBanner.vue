<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    tone?: 'ok' | 'warn' | 'bad'
    icon?: string
    /** 展示时长（毫秒） */
    duration?: number
  }>(),
  {
    tone: 'ok',
    icon: '💡',
    duration: 2800,
  },
)

const visible = ref(false)
const displayText = ref('')
const displayTone = ref<'ok' | 'warn' | 'bad'>('ok')
const displayIcon = ref('💡')
let hideTimer: number | null = null

function clearHideTimer() {
  if (hideTimer != null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function showToast(text: string) {
  displayText.value = text
  displayTone.value = props.tone
  displayIcon.value = props.icon || '💡'
  visible.value = true
  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    visible.value = false
    hideTimer = null
  }, props.duration)
}

watch(
  () => props.text,
  (text) => {
    const next = text?.trim() ?? ''
    // 文案清空时不强制打断当前轻提示，由计时自行收起
    if (!next) return
    showToast(next)
  },
  { immediate: true },
)

onUnmounted(clearHideTimer)
</script>

<template>
  <!-- 独立占位：在游戏场景外，不遮挡可操作区域 -->
  <div class="coach-slot" aria-live="polite">
    <Transition name="coach-toast">
      <div v-if="visible" class="coach" :class="displayTone" role="status">
        <span class="coach-icon" aria-hidden="true">{{ displayIcon }}</span>
        <div class="coach-body">
          <span class="coach-label">操作提示</span>
          <p class="coach-text">{{ displayText }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.coach-slot {
  position: relative;
  z-index: 2;
  flex: none;
  width: auto;
  min-height: 56px;
  margin: 0 16px 8px;
  pointer-events: none;
}

.coach {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1.5px solid rgba(91, 171, 255, 0.45);
  background:
    linear-gradient(135deg, rgba(22, 119, 255, 0.22), transparent 48%),
    rgba(6, 22, 38, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 8px 22px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(22, 119, 255, 0.12);
  pointer-events: none;
}

.coach.warn {
  border-color: rgba(255, 213, 74, 0.5);
  background:
    linear-gradient(135deg, rgba(255, 138, 0, 0.24), transparent 48%),
    rgba(28, 22, 8, 0.94);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 8px 22px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(255, 138, 0, 0.16);
}

.coach.bad {
  border-color: rgba(229, 57, 53, 0.55);
  background:
    linear-gradient(135deg, rgba(229, 57, 53, 0.28), transparent 48%),
    rgba(32, 10, 12, 0.96);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 8px 22px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(229, 57, 53, 0.18);
}

.coach-icon {
  flex: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(91, 171, 255, 0.4);
  background: linear-gradient(180deg, rgba(91, 171, 255, 0.35), rgba(22, 119, 255, 0.18));
  font-size: 16px;
  line-height: 1;
  box-shadow: 0 2px 10px rgba(22, 119, 255, 0.25);
}

.coach.warn .coach-icon {
  border-color: rgba(255, 213, 74, 0.45);
  background: linear-gradient(180deg, rgba(255, 213, 74, 0.4), rgba(255, 138, 0, 0.2));
  box-shadow: 0 2px 10px rgba(255, 138, 0, 0.28);
}

.coach.bad .coach-icon {
  border-color: rgba(255, 138, 128, 0.45);
  background: linear-gradient(180deg, rgba(255, 138, 128, 0.4), rgba(229, 57, 53, 0.22));
  box-shadow: 0 2px 10px rgba(229, 57, 53, 0.3);
}

.coach-body {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 3px;
}

.coach-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(22, 119, 255, 0.28);
  color: #9ec5ff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.4;
}

.coach.warn .coach-label {
  background: rgba(255, 138, 0, 0.28);
  color: #ffd54a;
}

.coach.bad .coach-label {
  background: rgba(229, 57, 53, 0.3);
  color: #ff8a80;
}

.coach-text {
  margin: 0;
  color: #e8f1ff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.coach.warn .coach-text {
  color: #ffe9a8;
}

.coach.bad .coach-text {
  color: #ffcdd2;
}

.coach-toast-enter-active {
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.coach-toast-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease;
}

.coach-toast-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.coach-toast-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}

.coach.bad.coach-toast-enter-active {
  animation: coachShake 0.42s ease both;
}

@keyframes coachShake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-2px);
  }
  100% {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .coach-toast-enter-active,
  .coach-toast-leave-active,
  .coach.bad.coach-toast-enter-active {
    transition: opacity 0.15s ease;
    animation: none;
  }

  .coach-toast-enter-from,
  .coach-toast-leave-to {
    transform: none;
  }
}
</style>
