<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameButton from '@/components/GameButton.vue'
import GameCoachBanner from '@/components/GameCoachBanner.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import GameProgress from '@/components/GameProgress.vue'
import GameTimer from '@/components/GameTimer.vue'
import ScorePopup from '@/components/ScorePopup.vue'
import { HAZARDS, type HazardItem } from '@/data/hazards'
import { useGameStore } from '@/stores/game'
import { assetUrl } from '@/utils/assets'
import { playTone } from '@/utils/sound'

const IDLE_HINT_MS = 3000

const router = useRouter()
const game = useGameStore()

const found = ref<Set<string>>(new Set())
const active = ref<HazardItem | null>(null)
const popup = ref<{ value: number; text: string } | null>(null)
const done = ref(false)
const missMsg = ref('')
const running = ref(true)
/** 右下角「给点提示」卡片 */
const showTipCard = ref(false)
/** 用户点击卡片后高亮的单个未发现隐患 */
const hintedId = ref<string | null>(null)

let idleTimer: number | null = null

const foundCount = computed(() => found.value.size)
const foundList = computed(() => HAZARDS.filter((h) => found.value.has(h.id)))
const unfound = computed(() => HAZARDS.filter((h) => !found.value.has(h.id)))
const hazardWebp = assetUrl('images/hazard-home.webp')
const hazardJpg = assetUrl('images/hazard-home.jpg')
const coachText = computed(() => {
  if (active.value) return `已发现：${active.value.label}。继续点击场景中可疑物品`
  if (missMsg.value) return missMsg.value
  if (hintedId.value) return '已高亮一处可疑位置，点击黄色框查看'
  // 空闲不常驻提示，避免遮挡操作；顶部任务条已说明玩法
  return ''
})
const coachTone = computed<'ok' | 'warn' | 'bad'>(() => {
  if (missMsg.value) return 'warn'
  if (active.value) return 'ok'
  return 'ok'
})

function clearIdleTimer() {
  if (idleTimer != null) {
    window.clearTimeout(idleTimer)
    idleTimer = null
  }
}

function scheduleTipCard() {
  showTipCard.value = false
  clearIdleTimer()
  if (done.value || unfound.value.length === 0) return
  idleTimer = window.setTimeout(() => {
    if (!done.value && unfound.value.length > 0) showTipCard.value = true
  }, IDLE_HINT_MS)
}

function onTipCardClick(e: Event) {
  e.stopPropagation()
  if (done.value) return
  const pool = unfound.value
  if (!pool.length) {
    showTipCard.value = false
    return
  }
  const pick = pool[Math.floor(Math.random() * pool.length)]
  hintedId.value = pick.id
  showTipCard.value = false
  playTone('click', game.soundEnabled)
  // 点完提示后再闲置 5 秒，才再次出现卡片
  scheduleTipCard()
}

function markFound(id: string) {
  const next = new Set(found.value)
  next.add(id)
  found.value = next
  game.hazardFound = next.size
  game.persist()
  if (hintedId.value === id) hintedId.value = null
}

function onHazard(id: string) {
  if (done.value || found.value.has(id)) return
  const item = HAZARDS.find((h) => h.id === id)
  if (!item) return

  scheduleTipCard()
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
  scheduleTipCard()
  playTone('wrong', game.soundEnabled)
  const msg = '这里暂时没有发现明显隐患。'
  // 清空后再写入，确保连续点空也能再次弹出轻提示
  missMsg.value = ''
  queueMicrotask(() => {
    missMsg.value = msg
  })
  window.setTimeout(() => {
    if (missMsg.value === msg) missMsg.value = ''
  }, 1200)
}

function finish(allFound: boolean) {
  if (done.value) return
  done.value = true
  running.value = false
  showTipCard.value = false
  hintedId.value = null
  clearIdleTimer()
  const score = allFound ? 20 : Math.min(20, found.value.size * 4)
  game.setLevelScore('hazard', score)
  game.currentLevel = 2
  game.persist()
  playTone(allFound ? 'success' : 'correct', game.soundEnabled)
}

onMounted(() => {
  scheduleTipCard()
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

    <p class="mission-guide">观察家庭场景，点击图中可疑物品找出消防安全隐患</p>
    <GameCoachBanner :text="coachText" :tone="coachTone" icon="🔍" />

    <div class="scene scene-panel" @click="onMiss">
      <picture class="scene-bg-wrap">
        <source :srcset="hazardWebp" type="image/webp" />
        <img
          class="scene-bg"
          :src="hazardJpg"
          alt="家庭场景中的消防隐患"
          draggable="false"
          decoding="async"
        />
      </picture>
      <div class="scene-veil" />

      <div class="zone living">客厅</div>
      <div class="zone kitchen">厨房</div>
      <div class="zone balcony">阳台</div>

      <button
        v-for="h in HAZARDS"
        :key="h.id"
        class="hotspot"
        :class="{ found: found.has(h.id), hint: hintedId === h.id && !found.has(h.id) }"
        type="button"
        :aria-label="h.label"
        :style="hotspotStyle(h)"
        @click.stop="onHazard(h.id)"
      >
        <span class="scan-ring" />
        <span v-if="found.has(h.id)" class="found-mark">✓</span>
      </button>

      <button
        v-if="showTipCard"
        class="tip-card"
        type="button"
        @click="onTipCardClick"
      >
        <span class="tip-card-emoji">💡</span>
        <span class="tip-card-text">
          <b>卡住了？</b>
          <i>点我高亮一处隐患</i>
        </span>
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
      <p v-else class="idle">在客厅、厨房、阳台仔细找可疑物品</p>

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
  width: min(calc(100% - 32px), calc(min(52dvh, 430px) * 4 / 3));
  aspect-ratio: 4 / 3;
  height: auto;
  margin: 0 auto;
  overflow: hidden;
  background: #1a2430;
}

.scene-bg-wrap,
.scene-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.scene-bg {
  object-fit: fill;
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

.tip-card {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: min(72%, 240px);
  padding: 10px 12px;
  border: 1px solid rgba(22, 119, 255, 0.35);
  border-radius: 12px;
  background: rgba(7, 26, 43, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.32);
  color: #d7e6ff;
  text-align: left;
  cursor: pointer;
  animation: tipCardIn 0.35s ease both;
  -webkit-tap-highlight-color: transparent;
}

.tip-card:active {
  transform: scale(0.98);
}

.tip-card-emoji {
  font-size: 18px;
  line-height: 1;
}

.tip-card-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.tip-card-text b {
  font-size: 13px;
  font-weight: 700;
  color: #9ec5ff;
}

.tip-card-text i {
  font-style: normal;
  font-size: 12px;
  color: #c9daf0;
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
  border: 1.5px dashed transparent;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

/* 仅在用户点击「给点提示」后显示黄色虚线 */
.hotspot.hint .scan-ring {
  inset: 4%;
  opacity: 1;
  border-width: 2px;
  border-color: rgba(255, 213, 74, 0.95);
  animation: hintBlink 0.85s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 213, 74, 0.35);
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
  color: #d7e6ff;
  font-size: 14px;
  font-weight: 600;
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

@keyframes tipCardIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
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
