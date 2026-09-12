<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameButton from '@/components/GameButton.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import GameProgress from '@/components/GameProgress.vue'
import GameTimer from '@/components/GameTimer.vue'
import ScorePopup from '@/components/ScorePopup.vue'
import { HAZARDS, type HazardItem } from '@/data/hazards'
import { useGameStore } from '@/stores/game'
import { playTone } from '@/utils/sound'

const IDLE_HINT_MS = 5000

const router = useRouter()
const game = useGameStore()

const found = ref<Set<string>>(new Set())
const active = ref<HazardItem | null>(null)
const popup = ref<{ value: number; text: string } | null>(null)
const done = ref(false)
const missMsg = ref('')
const running = ref(true)
const showHint = ref(false)

let idleTimer: number | null = null

const foundCount = computed(() => found.value.size)
const foundList = computed(() => HAZARDS.filter((h) => found.value.has(h.id)))

function clearIdleTimer() {
  if (idleTimer != null) {
    window.clearTimeout(idleTimer)
    idleTimer = null
  }
}

function resetIdleHint() {
  showHint.value = false
  clearIdleTimer()
  if (done.value) return
  idleTimer = window.setTimeout(() => {
    if (!done.value) showHint.value = true
  }, IDLE_HINT_MS)
}

function markFound(id: string) {
  const next = new Set(found.value)
  next.add(id)
  found.value = next
  game.hazardFound = next.size
  game.persist()
}

function onHazard(id: string) {
  if (done.value || found.value.has(id)) return
  const item = HAZARDS.find((h) => h.id === id)
  if (!item) return

  resetIdleHint()
  markFound(id)
  playTone('correct', game.soundEnabled)
  missMsg.value = ''
  active.value = item
  popup.value = { value: 4, text: item.label }
  window.setTimeout(() => {
    popup.value = null
  }, 1200)

  if (found.value.size >= HAZARDS.length) {
    finish(true)
  }
}

function onMiss() {
  if (done.value) return
  resetIdleHint()
  playTone('wrong', game.soundEnabled)
  missMsg.value = '这里暂时没有发现明显隐患。'
  window.setTimeout(() => {
    missMsg.value = ''
  }, 1200)
}

function finish(allFound: boolean) {
  if (done.value) return
  done.value = true
  running.value = false
  showHint.value = false
  clearIdleTimer()
  const score = allFound ? 20 : Math.min(20, found.value.size * 4)
  game.setLevelScore('hazard', score)
  game.currentLevel = 2
  game.persist()
  playTone(allFound ? 'success' : 'correct', game.soundEnabled)
}

onMounted(() => {
  resetIdleHint()
})

onUnmounted(() => {
  clearIdleTimer()
})

function nextLevel() {
  router.push('/level/escape')
}

function hotspotStyle(h: HazardItem) {
  return {
    left: `${h.x}%`,
    top: `${h.y}%`,
    width: `${h.w}%`,
    height: `${h.h}%`,
  }
}
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="01" title="隐患排查">
      <template #right>
        <div class="tops">
          <GameTimer :seconds="30" :running="running" @timeout="finish(false)" />
          <GameProgress :current="foundCount" :total="5" label="发现" />
        </div>
      </template>
    </GameHeader>

    <p class="mission">观察家庭场景，点击图中的消防安全隐患</p>

    <div class="scene scene-panel" @click="onMiss">
      <img
        class="scene-bg"
        src="/images/hazard-home.png"
        alt="家庭场景中的消防隐患"
        draggable="false"
      />
      <div class="scene-veil" />

      <div class="zone living">客厅</div>
      <div class="zone kitchen">厨房</div>
      <div class="zone balcony">阳台</div>

      <button
        v-for="h in HAZARDS"
        :key="h.id"
        class="hotspot"
        :class="{ found: found.has(h.id), hint: showHint && !found.has(h.id) }"
        type="button"
        :aria-label="h.label"
        :style="hotspotStyle(h)"
        @click.stop="onHazard(h.id)"
      >
        <span class="scan-ring" />
        <span v-if="found.has(h.id)" class="found-mark">✓</span>
      </button>

      <ScorePopup v-if="popup" :value="popup.value" :text="popup.text" />
    </div>

    <div class="ops">
      <div v-if="active" class="hazard-card">
        <p class="badge">⚠️ 发现隐患 · {{ active.zone }}</p>
        <h3>{{ active.label }}</h3>
        <p class="desc">{{ active.description }}</p>
        <p class="tip">{{ active.tip }}</p>
      </div>
      <p v-else-if="missMsg" class="miss">{{ missMsg }}</p>
      <p v-else class="idle">仔细观察场景，点击可疑物品找出隐患</p>

      <ul v-if="foundList.length" class="found-list">
        <li v-for="item in foundList" :key="item.id">
          <b>{{ item.label }}</b>
          <span>{{ item.description }}</span>
        </li>
      </ul>
    </div>

    <GameModal v-if="done" :title="foundCount >= 5 ? '隐患全部排除！' : '排查结束'">
      <p>
        本关得分 <strong>{{ game.levelScores.hazard }}</strong> / 20
      </p>
      <ul class="summary">
        <li v-for="item in foundList" :key="item.id">✓ {{ item.label }}</li>
      </ul>
      <p class="knowledge-tip">日常发现隐患应及时整改，防患于未然。</p>
      <template #footer>
        <GameButton block label="进入下一关" @click="nextLevel" />
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
  align-items: center;
}

.mission {
  padding: 0 16px 10px;
  color: var(--assist-gray);
  font-size: 13px;
}

.scene {
  position: relative;
  height: min(52dvh, 430px);
  margin: 0 16px;
  overflow: hidden;
  background: #1a2430;
}

.scene-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.scene-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(7, 26, 43, 0.12), transparent 24%),
    linear-gradient(0deg, rgba(7, 26, 43, 0.16), transparent 26%);
}

.zone {
  position: absolute;
  z-index: 2;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(7, 26, 43, 0.55);
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.living {
  left: 10%;
  top: 10%;
}

.kitchen {
  left: 46%;
  top: 10%;
}

.balcony {
  right: 8%;
  top: 10%;
}

.hotspot {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  border: none;
  padding: 0;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.scan-ring {
  position: absolute;
  inset: 8%;
  border-radius: 12px;
  border: 1.5px dashed rgba(255, 213, 74, 0.35);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.hotspot:not(.found):hover .scan-ring,
.hotspot:not(.found):active .scan-ring {
  opacity: 1;
  animation: dashPulse 1.2s linear infinite;
}

.hotspot.hint .scan-ring {
  inset: 4%;
  opacity: 1;
  border-width: 2px;
  border-color: rgba(255, 213, 74, 0.95);
  animation: hintBlink 0.85s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 213, 74, 0.35);
  pointer-events: none;
}

.hotspot.found {
  background: rgba(229, 57, 53, 0.18);
  box-shadow:
    0 0 0 2px rgba(229, 57, 53, 0.85),
    0 0 18px rgba(229, 57, 53, 0.35);
}

.found-mark {
  position: absolute;
  right: 4px;
  top: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e53935;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.ops {
  position: relative;
  z-index: 2;
  margin-top: 12px;
  padding: 0 16px;
  min-height: 120px;
  max-height: min(34dvh, 280px);
  overflow-y: auto;
}

.hazard-card {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 138, 0, 0.35);
  background: rgba(255, 138, 0, 0.08);
}

.badge {
  color: var(--flame-yellow);
  font-size: 13px;
  font-weight: 800;
}

.hazard-card h3 {
  margin-top: 8px;
  font-size: 16px;
  line-height: 1.35;
}

.desc {
  margin-top: 8px;
  color: #d7e6ff;
  font-size: 13px;
  line-height: 1.55;
}

.tip {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(143, 163, 184, 0.25);
  color: var(--assist-gray);
  font-size: 12px;
  line-height: 1.5;
}

.miss,
.idle {
  color: var(--assist-gray);
  font-size: 13px;
}

.found-list {
  list-style: none;
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.found-list li {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(22, 119, 255, 0.2);
}

.found-list b {
  display: block;
  color: #ffd7a8;
  font-size: 13px;
}

.found-list span {
  display: block;
  margin-top: 4px;
  color: var(--assist-gray);
  font-size: 12px;
  line-height: 1.45;
}

.summary {
  list-style: none;
  margin: 12px 0;
  display: grid;
  gap: 6px;
  color: #d7e6ff;
  font-size: 13px;
}

@keyframes dashPulse {
  to {
    border-color: rgba(255, 213, 74, 0.8);
  }
}

@keyframes hintBlink {
  0%,
  100% {
    opacity: 0.25;
    border-color: rgba(255, 213, 74, 0.35);
    box-shadow: 0 0 4px rgba(255, 213, 74, 0.15);
  }
  50% {
    opacity: 1;
    border-color: rgba(255, 213, 74, 1);
    box-shadow: 0 0 14px rgba(255, 213, 74, 0.55);
  }
}
</style>
