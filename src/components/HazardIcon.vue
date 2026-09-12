<script setup lang="ts">
defineProps<{
  type: 'socket' | 'battery' | 'cigarette' | 'stove' | 'exit'
}>()
</script>

<template>
  <svg class="hazard-icon" viewBox="0 0 64 64" aria-hidden="true">
    <!-- 插线板 -->
    <g v-if="type === 'socket'">
      <rect x="8" y="22" width="48" height="22" rx="4" fill="#2b3f55" stroke="#8fa3b8" stroke-width="2" />
      <rect x="14" y="28" width="10" height="10" rx="2" fill="#071a2b" stroke="#ffd54a" stroke-width="1.5" />
      <rect x="27" y="28" width="10" height="10" rx="2" fill="#071a2b" stroke="#ffd54a" stroke-width="1.5" />
      <rect x="40" y="28" width="10" height="10" rx="2" fill="#071a2b" stroke="#ff8a00" stroke-width="1.5" />
      <path d="M18 18v10M31 16v12M44 14v14" stroke="#ffd54a" stroke-width="2" stroke-linecap="round" />
      <circle cx="18" cy="16" r="2.2" fill="#e53935" />
      <circle cx="31" cy="14" r="2.2" fill="#e53935" />
      <circle cx="44" cy="12" r="2.2" fill="#e53935" />
      <path d="M12 48h40" stroke="#ff8a00" stroke-width="2" opacity="0.7" />
    </g>

    <!-- 电动车电池 -->
    <g v-else-if="type === 'battery'">
      <rect x="16" y="18" width="28" height="36" rx="4" fill="#1c3348" stroke="#8fa3b8" stroke-width="2" />
      <rect x="24" y="12" width="12" height="8" rx="2" fill="#8fa3b8" />
      <rect x="20" y="24" width="20" height="8" rx="1.5" fill="#43a047" />
      <rect x="20" y="34" width="20" height="8" rx="1.5" fill="#ffd54a" />
      <rect x="20" y="44" width="20" height="6" rx="1.5" fill="#e53935" />
      <path d="M48 28c6 4 8 10 4 16" fill="none" stroke="#1677ff" stroke-width="2.5" stroke-linecap="round" />
      <path d="M52 24l2 8-6-2" fill="none" stroke="#1677ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M10 22h6M10 32h6" stroke="#ff8a00" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- 未熄灭烟头 -->
    <g v-else-if="type === 'cigarette'">
      <rect x="10" y="30" width="34" height="8" rx="2" fill="#f5f0e6" stroke="#cbbfa8" stroke-width="1.5" />
      <rect x="36" y="30" width="10" height="8" fill="#e53935" />
      <rect x="44" y="30" width="8" height="8" rx="1" fill="#5d4037" />
      <circle cx="52" cy="28" r="3" fill="#ff8a00" />
      <circle cx="54" cy="24" r="2" fill="#ffd54a" opacity="0.9" />
      <path
        d="M50 20c2-4 0-8-2-10M54 18c3-5 1-9-1-12"
        fill="none"
        stroke="#8fa3b8"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.85"
      />
    </g>

    <!-- 燃气灶+杂物 -->
    <g v-else-if="type === 'stove'">
      <rect x="8" y="28" width="36" height="24" rx="3" fill="#26384c" stroke="#8fa3b8" stroke-width="2" />
      <circle cx="20" cy="40" r="7" fill="none" stroke="#ffd54a" stroke-width="2" />
      <circle cx="32" cy="40" r="7" fill="none" stroke="#ffd54a" stroke-width="2" />
      <path d="M20 34c1 2 1 5 0 8M32 34c1 2 1 5 0 8" stroke="#e53935" stroke-width="2" stroke-linecap="round" />
      <rect x="40" y="16" width="14" height="12" rx="2" fill="#8d6e63" stroke="#ff8a00" stroke-width="1.5" />
      <rect x="44" y="30" width="12" height="10" rx="2" fill="#a1887f" stroke="#ff8a00" stroke-width="1.5" />
      <path d="M46 14h8M48 22h6" stroke="#ffe0b2" stroke-width="1.5" />
    </g>

    <!-- 安全出口被堵 -->
    <g v-else>
      <rect x="14" y="10" width="28" height="40" rx="2" fill="#1b3d2a" stroke="#43a047" stroke-width="2" />
      <path d="M28 18v20" stroke="#a5d6a7" stroke-width="3" stroke-linecap="round" />
      <path d="M28 20l8 6M28 20l-8 6M28 36l8-6M28 36l-8-6" stroke="#a5d6a7" stroke-width="2.5" stroke-linecap="round" />
      <text x="28" y="48" text-anchor="middle" fill="#c8e6c9" font-size="7" font-weight="700">EXIT</text>
      <rect x="8" y="36" width="14" height="12" rx="1.5" fill="#8d6e63" stroke="#ff8a00" stroke-width="1.5" />
      <rect x="38" y="34" width="16" height="14" rx="1.5" fill="#6d4c41" stroke="#ff8a00" stroke-width="1.5" />
      <rect x="22" y="42" width="12" height="10" rx="1.5" fill="#a1887f" stroke="#e53935" stroke-width="1.5" />
    </g>
  </svg>
</template>

<style scoped>
.hazard-icon {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
</style>
