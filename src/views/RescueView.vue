<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EscapeIcon from '@/components/EscapeIcon.vue'
import FireEffect from '@/components/FireEffect.vue'
import GameButton from '@/components/GameButton.vue'
import GameCoachBanner from '@/components/GameCoachBanner.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import GameProgress from '@/components/GameProgress.vue'
import GameTimer from '@/components/GameTimer.vue'
import SmokeEffect from '@/components/SmokeEffect.vue'
import { useGameStore } from '@/stores/game'
import { clamp } from '@/utils/game'
import { playTone } from '@/utils/sound'

type HazardType = 'fire' | 'smoke' | 'junk'

interface Victim {
  id: number
  name: string
  x: number
  y: number
  rescued: boolean
}

interface Hazard {
  id: string
  x: number
  y: number
  label: string
  type: HazardType
  radius: number
  cleared?: boolean
}

const MAX_HP = 3
const SAFE = { x: 86, y: 50 }
/** 与右侧绿色安全区视觉范围对齐（百分比） */
const SAFE_ZONE = { minX: 72, maxX: 96, minY: 20, maxY: 80 }
const START = { x: 14, y: 72 }

const router = useRouter()
const game = useGameStore()

const sceneRef = ref<HTMLElement | null>(null)
const playerX = ref(START.x)
const playerY = ref(START.y)
const hp = ref(MAX_HP)
const dragging = ref(false)
const carryingId = ref<number | null>(null)
const hasTowel = ref(false)
const towel = ref({ x: 36, y: 78, taken: false })
const running = ref(true)
const done = ref(false)
const failed = ref(false)
const tip = ref('科普演练：自身安全第一。靠近被困者背起，避开明火与杂物，送往右侧安全出口')
const tipTone = ref<'ok' | 'warn' | 'bad'>('ok')
const timerKey = ref(0)
const firePulse = ref(0)

const victims = ref<Victim[]>([
  { id: 1, name: '老人', x: 22, y: 28, rescued: false },
  { id: 2, name: '孩子', x: 52, y: 24, rescued: false },
  { id: 3, name: '伤员', x: 48, y: 58, rescued: false },
])

const hazards = ref<Hazard[]>([
  { id: 'f1', x: 34, y: 36, label: '明火', type: 'fire', radius: 11 },
  { id: 'f2', x: 62, y: 48, label: '明火', type: 'fire', radius: 10 },
  { id: 's1', x: 42, y: 22, label: '浓烟', type: 'smoke', radius: 13 },
  { id: 's2', x: 68, y: 30, label: '浓烟', type: 'smoke', radius: 12 },
  { id: 'j1', x: 56, y: 68, label: '杂物', type: 'junk', radius: 8 },
  { id: 'j2', x: 30, y: 58, label: '杂物', type: 'junk', radius: 7 },
])

let smokeAccum = 0
let invulnUntil = 0
let smokeTimer: number | null = null
let fireTimer: number | null = null

const rescuedCount = computed(() => victims.value.filter((v) => v.rescued).length)
const carrying = computed(() => victims.value.find((v) => v.id === carryingId.value) ?? null)
const nearbyVictim = computed(() => {
  if (carryingId.value != null || done.value) return null
  return (
    victims.value.find(
      (v) => !v.rescued && dist(playerX.value, playerY.value, v.x, v.y) < 10,
    ) ?? null
  )
})
const nearJunk = computed(() => {
  return (
    hazards.value.find(
      (h) =>
        h.type === 'junk' &&
        !h.cleared &&
        dist(playerX.value, playerY.value, h.x, h.y) < h.radius + 4,
    ) ?? null
  )
})

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

function setTip(text: string, tone: 'ok' | 'warn' | 'bad' = 'ok') {
  tip.value = text
  tipTone.value = tone
}

function scenePoint(e: PointerEvent) {
  const scene = sceneRef.value
  if (!scene) return null
  const rect = scene.getBoundingClientRect()
  return {
    x: clamp(((e.clientX - rect.left) / rect.width) * 100, 8, 92),
    y: clamp(((e.clientY - rect.top) / rect.height) * 100, 12, 88),
  }
}

function activeHazards() {
  return hazards.value.filter((h) => !h.cleared)
}

function blockedByJunk(x: number, y: number) {
  return activeHazards().some(
    (h) => h.type === 'junk' && dist(x, y, h.x, h.y) < h.radius,
  )
}

function hitFire(x: number, y: number) {
  return activeHazards().find(
    (h) => h.type === 'fire' && dist(x, y, h.x, h.y) < h.radius,
  )
}

function inSmoke(x: number, y: number) {
  return activeHazards().some(
    (h) => h.type === 'smoke' && dist(x, y, h.x, h.y) < h.radius,
  )
}

function hurt(reason: string) {
  const now = performance.now()
  if (now < invulnUntil || done.value) return
  invulnUntil = now + 900
  hp.value -= 1
  playTone('wrong', game.soundEnabled)
  setTip(reason, 'bad')
  if (hp.value <= 0) fail()
}

function knockFromFire(fx: number, fy: number) {
  const angle = Math.atan2(playerY.value - fy, playerX.value - fx)
  playerX.value = clamp(playerX.value + Math.cos(angle) * 10, 8, 92)
  playerY.value = clamp(playerY.value + Math.sin(angle) * 10, 12, 88)
  syncCarry()
}

function syncCarry() {
  if (carryingId.value == null) return
  // 跟在身侧，避免完全挡住拖动落点视觉
  victims.value = victims.value.map((v) =>
    v.id === carryingId.value && !v.rescued
      ? { ...v, x: clamp(playerX.value + 5, 8, 92), y: clamp(playerY.value - 8, 12, 88) }
      : v,
  )
}

function tryPickupTowel() {
  if (towel.value.taken) return
  if (dist(playerX.value, playerY.value, towel.value.x, towel.value.y) < 9) {
    towel.value.taken = true
    hasTowel.value = true
    playTone('correct', game.soundEnabled)
    setTip('已拿到湿毛巾：穿越浓烟时伤害降低', 'ok')
  }
}

function inSafeZone(x: number, y: number) {
  return (
    x >= SAFE_ZONE.minX &&
    x <= SAFE_ZONE.maxX &&
    y >= SAFE_ZONE.minY &&
    y <= SAFE_ZONE.maxY
  )
}

function tryDeliver() {
  if (carryingId.value == null) return
  if (!inSafeZone(playerX.value, playerY.value)) return
  const id = carryingId.value
  victims.value = victims.value.map((v) =>
    v.id === id
      ? { ...v, rescued: true, x: SAFE.x - 2, y: 28 + id * 12 }
      : v,
  )
  carryingId.value = null
  playTone('correct', game.soundEnabled)
  game.rescuedPeople = rescuedCount.value
  game.persist()
  setTip(`已安全转移「${victims.value.find((v) => v.id === id)?.name}」！继续救援`, 'ok')
  if (rescuedCount.value >= 3) finish(true)
}

function onVictimPointerDown(id: number, e: PointerEvent) {
  // 背起后伤员跟着人物走，不能再拦截场景拖动
  if (carryingId.value != null || victims.value.find((v) => v.id === id)?.rescued) return
  if (nearbyVictim.value?.id !== id) return
  e.stopPropagation()
  pickUpVictim(id)
}

function pickUpVictim(id: number) {
  if (done.value || carryingId.value != null) return
  const v = victims.value.find((item) => item.id === id)
  if (!v || v.rescued) return
  if (dist(playerX.value, playerY.value, v.x, v.y) > 12) {
    setTip('再靠近一点才能背起被困人员', 'warn')
    return
  }
  carryingId.value = id
  playTone('click', game.soundEnabled)
  setTip(`正在转移「${v.name}」——避开明火，送往安全出口`, 'ok')
  syncCarry()
}

function clearJunk(id: string) {
  const h = hazards.value.find((item) => item.id === id)
  if (!h || h.type !== 'junk' || h.cleared) return
  if (dist(playerX.value, playerY.value, h.x, h.y) > h.radius + 5) {
    setTip('靠近杂物后再清理通道', 'warn')
    return
  }
  h.cleared = true
  playTone('correct', game.soundEnabled)
  setTip('通道已清理，可以继续前进', 'ok')
}

function moveTo(x: number, y: number) {
  if (done.value || failed.value) return

  if (blockedByJunk(x, y)) {
    setTip('杂物堵住通道，靠近后点击「清理」', 'warn')
    return
  }

  const fire = hitFire(x, y)
  if (fire) {
    knockFromFire(fire.x, fire.y)
    hurt('火焰灼伤！绕行，不要硬闯火场')
    return
  }

  const step = carryingId.value != null ? 0.72 : 1
  const dx = x - playerX.value
  const dy = y - playerY.value
  const len = Math.hypot(dx, dy) || 1
  const maxStep = 7 * step
  const nx = playerX.value + (dx / len) * Math.min(len, maxStep)
  const ny = playerY.value + (dy / len) * Math.min(len, maxStep)

  playerX.value = clamp(nx, 8, 92)
  playerY.value = clamp(ny, 12, 88)
  syncCarry()
  tryPickupTowel()
  tryDeliver()
}

function onPointerDown(e: PointerEvent) {
  if (done.value || failed.value) return
  const target = e.target as HTMLElement
  if (target.closest('.action-btn')) return
  dragging.value = true
  try {
    sceneRef.value?.setPointerCapture(e.pointerId)
  } catch {
    // ignore
  }
  const p = scenePoint(e)
  if (p) moveTo(p.x, p.y)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || done.value || failed.value) return
  e.preventDefault()
  const p = scenePoint(e)
  if (p) moveTo(p.x, p.y)
}

function onPointerUp(e?: PointerEvent) {
  dragging.value = false
  if (e && sceneRef.value?.hasPointerCapture?.(e.pointerId)) {
    try {
      sceneRef.value.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }
}

function startLoops() {
  stopLoops()
  smokeTimer = window.setInterval(() => {
    if (done.value || failed.value) return
    if (!inSmoke(playerX.value, playerY.value)) {
      smokeAccum = 0
      return
    }
    smokeAccum += hasTowel.value ? 0.35 : 0.75
    if (smokeAccum >= 1) {
      smokeAccum = 0
      hurt(hasTowel.value ? '浓烟仍有伤害，尽快离开烟区' : '吸入浓烟！请先拿湿毛巾防护')
    } else if (!hasTowel.value) {
      setTip('浓烟危险：先去拿湿毛巾再穿越', 'warn')
    }
  }, 280)

  fireTimer = window.setInterval(() => {
    if (done.value || failed.value) return
    firePulse.value = (firePulse.value + 1) % 100
    // 火焰缓慢扩散，增加压迫感
    hazards.value = hazards.value.map((h) => {
      if (h.type !== 'fire' || h.cleared) return h
      return { ...h, radius: Math.min(14, h.radius + 0.015) }
    })
  }, 500)
}

function stopLoops() {
  if (smokeTimer != null) {
    window.clearInterval(smokeTimer)
    smokeTimer = null
  }
  if (fireTimer != null) {
    window.clearInterval(fireTimer)
    fireTimer = null
  }
}

function fail() {
  if (done.value || failed.value) return
  failed.value = true
  running.value = false
  stopLoops()
  carryingId.value = null
  playTone('wrong', game.soundEnabled)
  setTip('救援失败：注意自身安全，火势过大应立即撤离并报警', 'bad')
}

/** 失败后可带当前救援分结束，避免反复卡关 */
function endWithScore() {
  if (done.value) return
  failed.value = false
  finish(false)
}

function finish(all: boolean) {
  if (done.value) return
  done.value = true
  failed.value = false
  running.value = false
  stopLoops()
  carryingId.value = null
  const score = Math.min(25, rescuedCount.value * 8 + (all ? 1 : 0))
  game.rescuedPeople = rescuedCount.value
  game.setLevelScore('rescue', score)
  game.completeGame()
  playTone(all ? 'success' : 'correct', game.soundEnabled)
  setTip(
    all
      ? '火线救援完成！三人全部安全转移'
      : rescuedCount.value > 0
        ? `救援结束：已安全转移 ${rescuedCount.value} 人`
        : '已结束挑战：火场中自身安全始终第一，优先撤离并报警',
    rescuedCount.value > 0 ? 'ok' : 'warn',
  )
}

function retry() {
  playerX.value = START.x
  playerY.value = START.y
  hp.value = MAX_HP
  carryingId.value = null
  hasTowel.value = false
  towel.value = { x: 36, y: 78, taken: false }
  victims.value = [
    { id: 1, name: '老人', x: 22, y: 28, rescued: false },
    { id: 2, name: '孩子', x: 52, y: 24, rescued: false },
    { id: 3, name: '伤员', x: 48, y: 58, rescued: false },
  ]
  hazards.value = [
    { id: 'f1', x: 34, y: 36, label: '明火', type: 'fire', radius: 11 },
    { id: 'f2', x: 62, y: 48, label: '明火', type: 'fire', radius: 10 },
    { id: 's1', x: 42, y: 22, label: '浓烟', type: 'smoke', radius: 13 },
    { id: 's2', x: 68, y: 30, label: '浓烟', type: 'smoke', radius: 12 },
    { id: 'j1', x: 56, y: 68, label: '杂物', type: 'junk', radius: 8 },
    { id: 'j2', x: 30, y: 58, label: '杂物', type: 'junk', radius: 7 },
  ]
  smokeAccum = 0
  invulnUntil = 0
  done.value = false
  failed.value = false
  running.value = true
  timerKey.value += 1
  game.rescuedPeople = 0
  game.persist()
  setTip('重新出发：背起被困者，绕开火点，送往安全出口', 'ok')
  startLoops()
}

function toResult() {
  router.push('/result')
}

function onTimeout() {
  if (done.value || failed.value) return
  if (rescuedCount.value > 0) finish(false)
  else fail()
}

startLoops()

onUnmounted(() => {
  stopLoops()
  dragging.value = false
})
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="05" title="火线救援">
      <template #right>
        <div class="tops">
          <GameTimer :key="timerKey" :seconds="60" :running="running" @timeout="onTimeout" />
          <GameProgress :current="rescuedCount" :total="3" label="救援" />
        </div>
      </template>
    </GameHeader>

    <p class="mission-guide">先自保再互助 · 拖动人物背起被困者 · 避开明火送往右侧安全区</p>
    <GameCoachBanner :text="tip" :tone="tipTone" icon="🦺" />

    <div class="roster" aria-label="救援进度">
      <div
        v-for="v in victims"
        :key="`roster-${v.id}`"
        class="roster-item"
        :class="{ done: v.rescued, active: carryingId === v.id }"
      >
        <i />
        <span>{{ v.name }}</span>
      </div>
    </div>

    <div
      ref="sceneRef"
      class="rescue-scene scene-panel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="floor-map" aria-hidden="true">
        <div class="floor-base" />
        <div class="floor-grid" />
        <div class="zone danger-room" />
        <div class="zone safe-room">
          <span>安全区</span>
        </div>
        <div class="wall w1" />
        <div class="wall w2" />
      </div>

      <SmokeEffect :density="4" />

      <div class="run-hud">
        <div class="hud-card" aria-label="生命值">
          <span v-for="i in MAX_HP" :key="i" class="heart" :class="{ on: i <= hp }">♥</span>
        </div>
        <div v-if="carrying || !hasTowel" class="hud-card status">
          <span v-if="!hasTowel" class="pill">寻找湿毛巾</span>
          <span v-if="carrying" class="pill on">护送 {{ carrying.name }}</span>
        </div>
      </div>

      <div
        v-for="h in hazards.filter((x) => !x.cleared && (x.type === 'fire' || x.type === 'smoke'))"
        :key="`aura-${h.id}`"
        class="danger-aura"
        :class="h.type"
        :style="{
          left: `${h.x}%`,
          top: `${h.y}%`,
          width: `${Math.max(16, h.radius * 2.2)}%`,
        }"
      />

      <div
        v-for="h in hazards.filter((x) => !x.cleared)"
        :key="h.id"
        class="icon-node"
        :class="h.type"
        :aria-label="h.label"
        :style="{ left: `${h.x}%`, top: `${h.y}%` }"
      >
        <FireEffect v-if="h.type === 'fire'" :intensity="0.7 + firePulse * 0.001" />
        <EscapeIcon v-else :type="h.type" />
      </div>

      <div
        v-if="!towel.taken"
        class="icon-node towel"
        aria-label="湿毛巾"
        :style="{ left: `${towel.x}%`, top: `${towel.y}%` }"
      >
        <EscapeIcon type="towel" />
        <span class="node-tag">湿毛巾</span>
      </div>

      <div
        class="icon-node exit"
        aria-label="安全出口"
        :style="{ left: `${SAFE.x}%`, top: `${SAFE.y}%` }"
      >
        <EscapeIcon type="exit" />
      </div>

      <button
        v-for="v in victims"
        :key="v.id"
        class="victim"
        :class="{
          rescued: v.rescued,
          carrying: carryingId === v.id,
          near: nearbyVictim?.id === v.id,
        }"
        type="button"
        :aria-label="v.rescued ? `${v.name}已救出` : `被困${v.name}`"
        :style="{ left: `${v.x}%`, top: `${v.y}%` }"
        @pointerdown="onVictimPointerDown(v.id, $event)"
      >
        <span v-if="v.rescued" class="rescued-mark">✓</span>
        <template v-else>
          <EscapeIcon type="victim" />
          <span class="victim-name">{{ v.name }}</span>
        </template>
      </button>

      <div
        class="player"
        :class="{ carrying: !!carrying, dragging }"
        :style="{ left: `${playerX}%`, top: `${playerY}%` }"
      >
        <EscapeIcon type="player" />
        <span class="player-tag">{{ carrying ? '护送中' : '救援者' }}</span>
      </div>

      <div v-if="nearbyVictim || nearJunk" class="action-dock">
        <button
          v-if="nearbyVictim"
          class="action-btn"
          type="button"
          @pointerdown.stop="pickUpVictim(nearbyVictim.id)"
        >
          背起{{ nearbyVictim.name }}
        </button>
        <button
          v-if="nearJunk"
          class="action-btn ghost"
          type="button"
          @pointerdown.stop="clearJunk(nearJunk.id)"
        >
          清理通道
        </button>
      </div>
    </div>

    <GameModal v-if="failed" title="救援失败">
      <p>生命值耗尽或未能完成转移。火场互助中，<strong>自身安全始终第一</strong>。</p>
      <p class="knowledge-tip">
        发现有人被困时，优先确保逃生通道畅通、正确拨打火警，切勿贸然闯入浓烟与明火区域。能力不足时应先撤离自保并引导专业力量到场。本关为科普演练，真实火场请以自保与报警为先。
      </p>
      <template #footer>
        <GameButton block label="重新挑战" @click="retry" />
        <GameButton
          block
          variant="ghost"
          :label="rescuedCount > 0 ? `带当前成绩结束（已救 ${rescuedCount} 人）` : '结束挑战并查看成绩'"
          @click="endWithScore"
        />
      </template>
    </GameModal>

    <GameModal v-if="done" :title="rescuedCount >= 3 ? '火线救援完成' : '救援演练结束'">
      <p>
        成功救援 <strong>{{ rescuedCount }}</strong> 人，本关
        <strong>{{ game.levelScores.rescue }}</strong> / 25
      </p>
      <p class="knowledge-tip">
        火场互助原则：先报火警、评估风险，优先低姿防烟、避开明火；能力不足时先撤离自保并继续呼救、指引。真实火场切勿贸然冲入。
      </p>
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
  margin: 0 16px 8px;
  color: var(--assist-gray);
  font-size: 13px;
}

.roster {
  display: flex;
  gap: 8px;
  margin: 0 16px 10px;
}

.roster-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 999px;
  border: 1px solid rgba(143, 163, 184, 0.22);
  background: rgba(7, 26, 43, 0.45);
  color: #c5d6ea;
  font-size: 12px;
  font-weight: 700;
}

.roster-item i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffd54a;
}

.roster-item.active {
  border-color: rgba(255, 213, 74, 0.5);
  background: rgba(255, 213, 74, 0.1);
}

.roster-item.done {
  border-color: rgba(67, 160, 71, 0.45);
  color: #a5d6a7;
}

.roster-item.done i {
  background: #43a047;
}

.rescue-scene {
  position: relative;
  margin: 0 16px;
  height: min(54dvh, 460px);
  overflow: hidden;
  touch-action: none;
  border-radius: 14px;
  border: 1px solid rgba(22, 119, 255, 0.25);
  background: #101b2a;
}

.floor-map {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floor-base {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 30%, rgba(229, 57, 53, 0.14), transparent 42%),
    radial-gradient(ellipse at 88% 50%, rgba(67, 160, 71, 0.16), transparent 38%),
    linear-gradient(180deg, #1a2838, #0d1622);
}

.floor-grid {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background:
    linear-gradient(90deg, rgba(143, 163, 184, 0.1) 1px, transparent 1px) 0 0 / 26px 26px,
    linear-gradient(rgba(143, 163, 184, 0.1) 1px, transparent 1px) 0 0 / 26px 26px;
}

.zone {
  position: absolute;
  border-radius: 12px;
}

.danger-room {
  left: 8%;
  top: 12%;
  width: 40%;
  height: 36%;
  background: rgba(229, 57, 53, 0.08);
  border: 1px solid rgba(229, 57, 53, 0.18);
}

.safe-room {
  right: 4%;
  top: 14%;
  width: 24%;
  height: 70%;
  display: grid;
  place-items: center;
  background: rgba(67, 160, 71, 0.14);
  border: 1.5px dashed rgba(129, 199, 132, 0.65);
  color: #a5d6a7;
  font-size: 12px;
  font-weight: 800;
}

.wall {
  position: absolute;
  background: rgba(160, 180, 210, 0.22);
  border-radius: 2px;
}

.w1 {
  left: 48%;
  top: 10%;
  width: 3px;
  height: 30%;
}

.w2 {
  left: 10%;
  top: 48%;
  width: 34%;
  height: 3px;
}

.run-hud {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

.hud-card {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(7, 26, 43, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.heart {
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
}

.heart.on {
  color: #e53935;
}

.pill {
  font-size: 11px;
  font-weight: 700;
  color: #ffe082;
}

.pill.on {
  color: #a5d6a7;
}

.danger-aura {
  position: absolute;
  z-index: 1;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
}

.danger-aura.fire {
  background: radial-gradient(circle, rgba(229, 57, 53, 0.28), transparent 72%);
}

.danger-aura.smoke {
  background: radial-gradient(circle, rgba(140, 160, 180, 0.22), transparent 72%);
}

.icon-node {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(7, 26, 43, 0.7);
  border: 1px solid rgba(143, 163, 184, 0.3);
  display: grid;
  place-items: center;
  pointer-events: none;
}

.icon-node :deep(.escape-icon) {
  width: 30px;
  height: 30px;
}

.icon-node.fire {
  width: auto;
  height: auto;
  background: transparent;
  border: none;
}

.icon-node.towel {
  width: 52px;
  height: auto;
  padding: 6px 4px 4px;
  gap: 2px;
  display: grid;
  justify-items: center;
  border-color: rgba(22, 119, 255, 0.55);
  background: rgba(7, 26, 43, 0.78);
  animation: towelBob 1.5s ease-in-out infinite;
}

.icon-node.towel :deep(.escape-icon) {
  width: 34px;
  height: 34px;
}

.node-tag {
  font-size: 10px;
  font-weight: 800;
  color: #b3e5fc;
  white-space: nowrap;
  line-height: 1.2;
}

@keyframes towelBob {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(-50%, calc(-50% - 6px));
  }
}

.icon-node.exit {
  width: 48px;
  height: 48px;
  border-color: rgba(67, 160, 71, 0.55);
  background: rgba(27, 61, 42, 0.75);
}

.victim {
  position: absolute;
  z-index: 4;
  transform: translate(-50%, -50%);
  width: 52px;
  padding: 4px 2px 5px;
  border-radius: 12px;
  background: rgba(7, 26, 43, 0.7);
  border: 1.5px solid rgba(255, 213, 74, 0.65);
  display: grid;
  justify-items: center;
  gap: 1px;
  pointer-events: none;
}

.victim :deep(.escape-icon) {
  width: 30px;
  height: 30px;
}

.victim-name {
  font-size: 10px;
  font-weight: 800;
  color: #ffe082;
}

.victim.near {
  pointer-events: auto;
  box-shadow: 0 0 12px rgba(255, 213, 74, 0.4);
}

.victim.carrying {
  pointer-events: none;
  border-color: rgba(129, 212, 250, 0.7);
}

.victim.rescued {
  background: rgba(22, 119, 255, 0.25);
  border-color: rgba(22, 119, 255, 0.55);
}

.rescued-mark {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #1677ff;
  color: #fff;
  font-weight: 800;
}

.player {
  position: absolute;
  z-index: 6;
  transform: translate(-50%, -50%);
  width: 56px;
  display: grid;
  justify-items: center;
  gap: 2px;
  pointer-events: none;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4));
}

.player :deep(.escape-icon) {
  width: 42px;
  height: 42px;
}

.player-tag {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(67, 160, 71, 0.92);
  border: 1px solid rgba(200, 230, 201, 0.45);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  line-height: 1.2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}

.player.carrying .player-tag {
  background: rgba(255, 167, 38, 0.95);
  border-color: rgba(255, 224, 130, 0.5);
}

.player.carrying {
  filter: drop-shadow(0 0 10px rgba(255, 213, 74, 0.35));
}

.player.dragging {
  scale: 1.04;
}

.action-dock {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 8;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  background: #e53935;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
}

.action-btn.ghost {
  background: #1677ff;
}
</style>
