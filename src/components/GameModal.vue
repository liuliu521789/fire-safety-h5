<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    closable?: boolean
    /** 是否展示豫小安 IP，默认开启 */
    mascot?: boolean
  }>(),
  { mascot: true },
)

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="modal-mask" @click.self="closable && emit('close')">
    <div class="modal-panel scene-panel" :class="{ 'has-mascot': mascot }">
      <img
        v-if="mascot"
        class="mascot"
        src="/images/mascot.png"
        alt="豫小安"
        draggable="false"
      />
      <button
        v-if="closable"
        class="close-btn"
        type="button"
        aria-label="关闭"
        @click="emit('close')"
      >
        ×
      </button>
      <h3 v-if="title">{{ title }}</h3>
      <div class="body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  padding-top: 88px;
  background: rgba(2, 10, 18, 0.72);
  backdrop-filter: blur(6px);
}

.modal-panel {
  position: relative;
  width: min(100%, 360px);
  padding: 22px 18px 18px;
}

.modal-panel.has-mascot {
  padding-top: 28px;
}

.mascot {
  position: absolute;
  left: 50%;
  top: -86px;
  width: 112px;
  height: auto;
  transform: translateX(-50%);
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
  z-index: 2;
  animation: mascotPop 0.45s cubic-bezier(0.22, 1.2, 0.36, 1) both;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 3;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #d7e6ff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

h3 {
  margin-bottom: 12px;
  font-size: 18px;
  text-align: center;
}

.body {
  color: #d7e6ff;
  font-size: 14px;
  line-height: 1.6;
}

.footer {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

@keyframes mascotPop {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px) scale(0.86);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
</style>
