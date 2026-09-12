<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EscapeIcon from '@/components/EscapeIcon.vue'
import FireEffect from '@/components/FireEffect.vue'
import GameButton from '@/components/GameButton.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import GameProgress from '@/components/GameProgress.vue'
import GameTimer from '@/components/GameTimer.vue'
import SmokeEffect from '@/components/SmokeEffect.vue'
import { useGameStore } from '@/stores/game'
import { clamp } from '@/utils/game'
import { playTone } from '@/utils/sound'

/**
 * 文档第 15 节截断，本关按“高潮救援”补全：
 * 拖动被困人员到安全区，避开火焰，限时救援 3 人，满分 25。
 */
interface Victim {
  id: number
  x: number
  y: number
  rescued: boolean
}

const router = useRouter()
const game = useGameStore()

const victims = ref<Victim[]>([
  { id: 1, x: 28, y: 42, rescued: false },
  { id: 2, x: 62, y: 36, rescued: false },
  { id: 3, x: 48, y: 62, rescued: false },
])
const draggingId = ref<number | null>(null)
const running = ref(true)
const done = ref(false)
const msg = ref('拖动被困人员到右侧安全区')
const safeZone = { x: 86, y: 50 }

const rescuedCount = computed(() => victims.value.filter((v) => v.rescued).length)

function onDown(id: number, e: PointerEvent) {
  if (done.value) return
  const v = victims.value.find((item) => item.id === id)
  if (!v || v.rescued) return
  draggingId.value = id
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (draggingId.value === null || done.value) return
  const scene = document.querySelector('.rescue-scene') as HTMLElement | null
  if (!scene) return
  const rect = scene.getBoundingClientRect()
  const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 8, 92)
  const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 12, 88)

  // fire hazard zones
  const fires = [
    { x: 40, y: 28 },
    { x: 58, y: 55 },
  ]
  for (const f of fires) {
    if (Math.hypot(x - f.x, y - f.y) < 10) {
      msg.value = '⚠️ 火焰区域危险，绕行！'
      playTone('wrong', game.soundEnabled)
      return
    }
  }

  victims.value = victims.value.map((v) =>
    v.id === draggingId.value ? { ...v, x, y } : v,
  )

  if (Math.hypot(x - safeZone.x, y - safeZone.y) < 12) {
    rescue(draggingId.value)
  }
}

function onUp() {
  draggingId.value = null
}

function rescue(id: number) {
  const target = victims.value.find((v) => v.id === id)
  if (!target || target.rescued) return
  victims.value = victims.value.map((v) =>
    v.id === id ? { ...v, rescued: true, x: safeZone.x, y: 30 + id * 14 } : v,
  )
  draggingId.value = null
  playTone('correct', game.soundEnabled)
  msg.value = `✅ 已救出第 ${rescuedCount.value} 人`
  game.rescuedPeople = rescuedCount.value
  game.persist()
  if (rescuedCount.value >= 3) finish(true)
}

function finish(all: boolean) {
  if (done.value) return
  done.value = true
  running.value = false
  const score = Math.min(25, rescuedCount.value * 8 + (all ? 1 : 0))
  // 3*8+1=25 when all rescued
  game.rescuedPeople = rescuedCount.value
  game.setLevelScore('rescue', score)
  game.completeGame()
  playTone(all ? 'success' : 'correct', game.soundEnabled)
  msg.value = all ? '🔥 火线救援完成！' : '救援结束'
}

function toResult() {
  router.push('/result')
}

onUnmounted(() => {
  draggingId.value = null
})
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="05" title="火线救援">
      <template #right>
        <div class="tops">
          <GameTimer :seconds="35" :running="running" @timeout="finish(false)" />
          <GameProgress :current="rescuedCount" :total="3" label="救援" />
        </div>
      </template>
    </GameHeader>

    <p class="mission">拖动被困人员避开火焰，送达安全区</p>

    <div
      class="rescue-scene scene-panel"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <SmokeEffect :density="6" />
      <div class="building">高层火场</div>
      <div class="fire-spot a"><FireEffect :intensity="0.85" /></div>
      <div class="fire-spot b"><FireEffect :intensity="0.7" /></div>
      <div class="safe">安全区</div>

      <button
        v-for="v in victims"
        :key="v.id"
        class="victim"
        :class="{ rescued: v.rescued, dragging: draggingId === v.id }"
        type="button"
        :aria-label="v.rescued ? '已救出' : '被困人员'"
        :style="{ left: `${v.x}%`, top: `${v.y}%` }"
        @pointerdown="onDown(v.id, $event)"
      >
        <span v-if="v.rescued" class="rescued-mark">✓</span>
        <EscapeIcon v-else type="victim" />
      </button>

      <p class="banner">{{ msg }}</p>
    </div>

    <GameModal v-if="done" title="火线救援完成">
      <p>
        成功救援 <strong>{{ rescuedCount }}</strong> 人，本关
        <strong>{{ game.levelScores.rescue }}</strong> / 25
      </p>
      <p class="knowledge-tip">专业救援请交由消防人员，自身安全始终第一位。</p>
      <template #footer>
        <GameButton block label="查看能力报告" @click="toResult" />
      </template>
    </GameModal>
  </div>
</template>

<style scoped>
.level {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(16px + var(--safe-bottom));
}

.tops {
  display: flex;
  gap: 8px;
}

.mission {
  padding: 0 16px 10px;
  color: var(--assist-gray);
  font-size: 13px;
}

.rescue-scene {
  position: relative;
  margin: 0 16px;
  height: min(58dvh, 480px);
  overflow: hidden;
  touch-action: none;
  background:
    linear-gradient(90deg, rgba(229, 57, 53, 0.12), transparent 40%),
    linear-gradient(180deg, #1b2f45, #0a1726);
}

.building {
  position: absolute;
  left: 12%;
  top: 12%;
  color: rgba(215, 230, 255, 0.45);
  letter-spacing: 0.16em;
  font-size: 12px;
}

.fire-spot {
  position: absolute;
  transform: translate(-50%, -50%);
}

.fire-spot.a {
  left: 40%;
  top: 28%;
}

.fire-spot.b {
  left: 58%;
  top: 55%;
}

.safe {
  position: absolute;
  right: 4%;
  top: 22%;
  width: 22%;
  height: 56%;
  border-radius: 14px;
  border: 1px dashed rgba(22, 119, 255, 0.65);
  background: rgba(22, 119, 255, 0.12);
  display: grid;
  place-items: center;
  color: #9ec5ff;
  font-size: 12px;
  font-weight: 700;
}

.victim {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(7, 26, 43, 0.55);
  border: 1.5px solid rgba(255, 213, 74, 0.65);
  color: var(--flame-yellow);
  display: grid;
  place-items: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}

.victim.dragging {
  scale: 1.08;
  box-shadow: 0 0 16px rgba(255, 213, 74, 0.45);
}

.victim.rescued {
  background: rgba(22, 119, 255, 0.28);
  border-color: rgba(22, 119, 255, 0.7);
  color: #d7e6ff;
}

.rescued-mark {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #1677ff;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}

.banner {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 4;
  text-align: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(7, 26, 43, 0.78);
  font-size: 13px;
}
</style>
