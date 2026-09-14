<script setup lang="ts">
withDefaults(
  defineProps<{
    text: string
    tone?: 'ok' | 'warn' | 'bad'
    /** 保留兼容，默认不再展示表情 */
    icon?: string
  }>(),
  {
    tone: 'ok',
    icon: '',
  },
)
</script>

<template>
  <div class="coach" :class="tone" role="status">
    <span class="coach-mark" aria-hidden="true" />
    <p class="coach-text">{{ text }}</p>
  </div>
</template>

<style scoped>
.coach {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  z-index: 12;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px 10px 11px;
  border-radius: 12px;
  border: 1px solid rgba(22, 119, 255, 0.28);
  background: rgba(7, 26, 43, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  pointer-events: none;
  animation: coachIn 0.22s ease both;
}

.coach.warn {
  border-color: rgba(255, 183, 77, 0.38);
  background: rgba(28, 24, 12, 0.82);
}

.coach.bad {
  border-color: rgba(229, 57, 53, 0.42);
  background: rgba(32, 12, 14, 0.84);
}

.coach-mark {
  flex: none;
  width: 3px;
  align-self: stretch;
  min-height: 1.2em;
  margin-top: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, #5babff, #1677ff);
}

.coach.warn .coach-mark {
  background: linear-gradient(180deg, #ffd54a, #ff8a00);
}

.coach.bad .coach-mark {
  background: linear-gradient(180deg, #ff8a80, #e53935);
}

.coach-text {
  margin: 0;
  min-width: 0;
  flex: 1;
  color: #e8f1ff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.02em;
}

.coach.warn .coach-text {
  color: #ffe9a8;
}

.coach.bad .coach-text {
  color: #ffcdd2;
}

@keyframes coachIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .coach {
    animation: none;
  }
}
</style>
