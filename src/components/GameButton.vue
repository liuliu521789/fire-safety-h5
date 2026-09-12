<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    variant?: 'primary' | 'ghost' | 'danger'
    disabled?: boolean
    block?: boolean
  }>(),
  {
    label: '',
    variant: 'primary',
    disabled: false,
    block: false,
  },
)

const emit = defineEmits<{ click: [MouseEvent] }>()
</script>

<template>
  <button
    class="game-btn"
    :class="[variant, { block, disabled }]"
    type="button"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <span class="glow" />
    <span class="label"><slot>{{ label }}</slot></span>
  </button>
</template>

<style scoped>
.game-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 28px;
  border-radius: 999px;
  overflow: hidden;
  transition: transform 0.15s ease, filter 0.2s ease;
}

.game-btn.block {
  width: 100%;
}

.game-btn.primary {
  background: linear-gradient(135deg, #1b86ff, #0d5ad8 55%, #1677ff);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 8px 24px rgba(22, 119, 255, 0.45);
}

.game-btn.danger {
  background: linear-gradient(135deg, #ff5a4f, #e53935);
  box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
}

.game-btn.ghost {
  border: 1px solid rgba(143, 163, 184, 0.45);
  background: rgba(255, 255, 255, 0.04);
  color: var(--assist-gray);
}

.game-btn:active:not(.disabled) {
  transform: scale(0.96);
}

.game-btn.disabled {
  opacity: 0.45;
  filter: grayscale(0.3);
}

.glow {
  position: absolute;
  inset: -40% auto auto -20%;
  width: 60%;
  height: 180%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  transform: rotate(18deg);
  animation: shine 3.2s ease-in-out infinite;
}

.label {
  position: relative;
  z-index: 1;
  font-weight: 700;
  letter-spacing: 0.08em;
}

@keyframes shine {
  0%,
  55% {
    transform: translateX(-120%) rotate(18deg);
  }
  100% {
    transform: translateX(280%) rotate(18deg);
  }
}
</style>
