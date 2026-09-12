<script setup lang="ts">
defineProps<{
  type: 'fire' | 'smoke' | 'junk' | 'lift' | 'wrong' | 'exit' | 'player' | 'victim' | 'towel'
}>()
</script>

<template>
  <svg class="escape-icon" viewBox="0 0 64 64" aria-hidden="true">
    <!-- 火焰 -->
    <g v-if="type === 'fire'">
      <path
        d="M32 8c8 10 18 14 18 28a18 18 0 1 1-36 0c0-10 7-16 18-28z"
        fill="#e53935"
      />
      <path
        d="M32 22c5 6 10 9 10 16a10 10 0 1 1-20 0c0-5 4-9 10-16z"
        fill="#ff8a00"
      />
      <path d="M32 34c2 3 5 4 5 8a5 5 0 1 1-10 0c0-3 2-5 5-8z" fill="#ffd54a" />
    </g>

    <!-- 烟雾 -->
    <g v-else-if="type === 'smoke'">
      <circle cx="22" cy="36" r="12" fill="#8fa3b8" opacity="0.55" />
      <circle cx="36" cy="30" r="14" fill="#aebccc" opacity="0.5" />
      <circle cx="44" cy="40" r="10" fill="#8fa3b8" opacity="0.45" />
      <circle cx="28" cy="22" r="8" fill="#cfd8e3" opacity="0.4" />
    </g>

    <!-- 杂物 -->
    <g v-else-if="type === 'junk'">
      <rect x="10" y="34" width="20" height="16" rx="2" fill="#8d6e63" />
      <rect x="28" y="28" width="22" height="22" rx="2" fill="#6d4c41" />
      <rect x="18" y="18" width="16" height="14" rx="2" fill="#a1887f" />
      <path d="M12 30h14M30 24h16" stroke="#ffcc80" stroke-width="2" />
    </g>

    <!-- 电梯 -->
    <g v-else-if="type === 'lift'">
      <rect x="14" y="8" width="36" height="48" rx="3" fill="#26384c" stroke="#ff8a00" stroke-width="2" />
      <path d="M32 10v44" stroke="#ffd54a" stroke-width="2" />
      <rect x="18" y="16" width="10" height="14" rx="1" fill="#071a2b" />
      <rect x="36" y="16" width="10" height="14" rx="1" fill="#071a2b" />
      <circle cx="23" cy="40" r="2.5" fill="#e53935" />
      <circle cx="41" cy="40" r="2.5" fill="#43a047" />
      <path d="M20 52h24" stroke="#8fa3b8" stroke-width="2" />
    </g>

    <!-- 错误出口 -->
    <g v-else-if="type === 'wrong'">
      <rect x="12" y="10" width="40" height="44" rx="3" fill="#3a1d1d" stroke="#e53935" stroke-width="2" />
      <path d="M22 22l20 20M42 22L22 42" stroke="#e53935" stroke-width="4" stroke-linecap="round" />
      <text x="32" y="50" text-anchor="middle" fill="#ffc5c2" font-size="8" font-weight="700">禁止</text>
    </g>

    <!-- 安全出口 -->
    <g v-else-if="type === 'exit'">
      <rect x="12" y="8" width="40" height="48" rx="3" fill="#1b3d2a" stroke="#43a047" stroke-width="2" />
      <path d="M32 16v24" stroke="#c8e6c9" stroke-width="3" stroke-linecap="round" />
      <path
        d="M32 18l10 8M32 18l-10 8M32 38l10-8M32 38l-10-8"
        stroke="#c8e6c9"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <text x="32" y="52" text-anchor="middle" fill="#a5d6a7" font-size="7" font-weight="700">EXIT</text>
    </g>

    <!-- 湿毛巾道具 -->
    <g v-else-if="type === 'towel'">
      <ellipse cx="32" cy="50" rx="16" ry="4" fill="#0d2137" opacity="0.35" />
      <path
        d="M14 22c0-6 8-10 18-10s18 4 18 10v18c0 5-8 9-18 9s-18-4-18-9V22z"
        fill="#81d4fa"
      />
      <path
        d="M16 24c1 4 8 7 16 7s15-3 16-7"
        fill="none"
        stroke="#e1f5fe"
        stroke-width="2"
        opacity="0.85"
      />
      <path
        d="M18 34c2 3 8 5 14 5s12-2 14-5"
        fill="none"
        stroke="#4fc3f7"
        stroke-width="2"
        opacity="0.7"
      />
      <path
        d="M22 18c3-2 7-3 10-3 4 0 8 1 12 3"
        fill="none"
        stroke="#29b6f6"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <circle cx="24" cy="40" r="2" fill="#e1f5fe" opacity="0.8" />
      <circle cx="38" cy="42" r="1.6" fill="#e1f5fe" opacity="0.7" />
    </g>

    <!-- 玩家：普通互助逃生者 -->
    <g v-else-if="type === 'player'">
      <circle cx="32" cy="14" r="8" fill="#ffcc80" />
      <path d="M24 12c1-7 15-7 16 0" fill="#5d4037" />
      <path d="M18 26h28l-2 22H20z" fill="#43a047" />
      <path d="M22 34h20" stroke="#2e7d32" stroke-width="2" />
      <path d="M18 30c-5 1-8 7-6 12" stroke="#ffcc80" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M46 30c5 1 8 7 6 12" stroke="#ffcc80" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M24 48v10M40 48v10" stroke="#455a64" stroke-width="4" stroke-linecap="round" />
    </g>

    <!-- 被困人员：普通人举手呼救 -->
    <g v-else>
      <!-- 呼救波纹 -->
      <path
        d="M46 14c4 2 6 6 6 10M50 12c5 3 8 8 8 13"
        fill="none"
        stroke="#ff8a00"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.85"
      />
      <!-- 头 -->
      <circle cx="28" cy="16" r="9" fill="#ffcc80" />
      <!-- 头发 -->
      <path d="M20 14c1-8 15-8 16 0" fill="#5d4037" />
      <!-- 惊恐表情 -->
      <circle cx="25" cy="16" r="1.4" fill="#333" />
      <circle cx="31" cy="16" r="1.4" fill="#333" />
      <ellipse cx="28" cy="20.5" rx="2.2" ry="1.6" fill="#333" />
      <!-- 举手 -->
      <path d="M40 30c6-10 8-14 6-18" stroke="#ffcc80" stroke-width="4" stroke-linecap="round" fill="none" />
      <circle cx="46" cy="12" r="3.2" fill="#ffcc80" />
      <!-- 身体（便服） -->
      <path d="M18 28h18l2 22H18z" fill="#42a5f5" />
      <path d="M18 34h20" stroke="#1e88e5" stroke-width="2" />
      <!-- 另一只手 -->
      <path d="M18 32c-5 2-7 8-5 12" stroke="#ffcc80" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- 腿 -->
      <path d="M22 50v10M32 50v10" stroke="#455a64" stroke-width="4" stroke-linecap="round" />
    </g>
  </svg>
</template>

<style scoped>
.escape-icon {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
</style>
