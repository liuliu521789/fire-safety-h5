<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EscapeIcon from '@/components/EscapeIcon.vue'
import FireEffect from '@/components/FireEffect.vue'
import GameButton from '@/components/GameButton.vue'
import GameCoachBanner from '@/components/GameCoachBanner.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import GameTimer from '@/components/GameTimer.vue'
import SmokeEffect from '@/components/SmokeEffect.vue'
import {
  ESCAPE_QUIZ_COUNT,
  checkEscapeAnswer,
  formatAnswerKeys,
  isMultiQuestion,
  pickEscapeQuestions,
} from '@/data/questions'
import { useGameStore } from '@/stores/game'
import { clamp } from '@/utils/game'
import { playTone } from '@/utils/sound'

type HazardType = 'fire' | 'smoke' | 'junk' | 'lift' | 'wrong'
type MsgTone = 'ok' | 'warn' | 'bad'

interface Hazard {
  id: string
  x: number
  y: number
  label: string
  type: HazardType
  radius: number
  baseX?: number
  moveAmp?: number
  radiusBase?: number
  radiusPulse?: number
}

const router = useRouter()
const game = useGameStore()

const quizList = ref(pickEscapeQuestions(ESCAPE_QUIZ_COUNT))
const phase = ref<'quiz' | 'run' | 'done'>('quiz')
const qIndex = ref(0)
const correctCount = ref(0)
const locked = ref(false)
const selected = ref<string[]>([])
const answeredOk = ref<boolean | null>(null)
const submittedKeys = ref<string[]>([])
const showExplain = ref(false)

const runMsg = ref('拖动被困人员，沿走廊逃生，抵达楼梯安全出口')
const msgTone = ref<MsgTone>('ok')
const playerX = ref(28)
const playerY = ref(18)
const running = ref(false)
const showRunIntro = ref(false)
const success = ref(false)
const done = ref(false)
const dragging = ref(false)
const runTimerKey = ref(0)

const hp = ref(3)
const maxHp = 3
const hasTowel = ref(false)
const towel = ref({ x: 52, y: 40, taken: false })
const perfectEscape = ref(true)
const invincibleUntil = ref(0)
const hurtFlash = ref(false)
let smokeAccum = 0
let hurtTimer: number | null = null

const question = computed(() => quizList.value[qIndex.value])
const quizTotal = computed(() => quizList.value.length)
const multiMode = computed(() => (question.value ? isMultiQuestion(question.value) : false))
const canSubmitMulti = ref(false)
const correctAnswerText = computed(() =>
  question.value ? formatAnswerKeys(question.value.answer) : '',
)

let submitEnableTimer: number | null = null
let fireRaf = 0
let smokeTimer: number | null = null

const hazards = ref<Hazard[]>([
  {
    id: 'fire1',
    x: 22,
    y: 32,
    baseX: 22,
    moveAmp: 7,
    label: '火焰',
    type: 'fire',
    radius: 11,
    radiusBase: 11,
    radiusPulse: 2.5,
  },
  {
    id: 'fire2',
    x: 58,
    y: 62,
    baseX: 58,
    moveAmp: 5,
    label: '火焰',
    type: 'fire',
    radius: 10,
    radiusBase: 10,
    radiusPulse: 2,
  },
  { id: 'smoke1', x: 70, y: 36, label: '浓烟', type: 'smoke', radius: 14 },
  { id: 'junk', x: 38, y: 52, label: '杂物', type: 'junk', radius: 9 },
  { id: 'lift', x: 82, y: 58, label: '电梯（禁）', type: 'lift', radius: 11 },
  { id: 'wrong', x: 14, y: 72, label: '错误出口', type: 'wrong', radius: 10 },
])

const exit = { x: 72, y: 88 }

function clearSubmitEnableTimer() {
  if (submitEnableTimer != null) {
    window.clearTimeout(submitEnableTimer)
    submitEnableTimer = null
  }
}

function armMultiSubmit() {
  canSubmitMulti.value = false
  clearSubmitEnableTimer()
  submitEnableTimer = window.setTimeout(() => {
    canSubmitMulti.value = selected.value.length > 0
    submitEnableTimer = null
  }, 320)
}

function optionClass(key: string) {
  if (!showExplain.value || !question.value) {
    return { on: selected.value.includes(key) }
  }
  const isCorrect = question.value.answer.includes(key)
  const isPicked = submittedKeys.value.includes(key)
  return {
    on: isPicked,
    correct: isCorrect,
    wrong: isPicked && !isCorrect,
  }
}

function toggleOption(key: string) {
  if (locked.value || showExplain.value || !question.value) return
  if (isMultiQuestion(question.value)) {
    playTone('click', game.soundEnabled)
    if (selected.value.includes(key)) {
      selected.value = selected.value.filter((k) => k !== key)
    } else {
      selected.value = [...selected.value, key]
    }
    armMultiSubmit()
    return
  }
  submitAnswer([key])
}

function submitMulti() {
  if (locked.value || showExplain.value || !multiMode.value) return
  if (!canSubmitMulti.value || selected.value.length === 0) return
  submitAnswer([...selected.value])
}

function submitAnswer(keys: string[]) {
  if (locked.value || !question.value) return
  locked.value = true
  canSubmitMulti.value = false
  clearSubmitEnableTimer()
  submittedKeys.value = [...keys]
  selected.value = [...keys]
  const ok = checkEscapeAnswer(question.value, keys)
  answeredOk.value = ok
  showExplain.value = true
  if (ok) {
    correctCount.value += 1
    playTone('correct', game.soundEnabled)
  } else {
    playTone('wrong', game.soundEnabled)
  }
  game.escapeCorrect = correctCount.value
  game.persist()
}

function goNextQuestion() {
  if (!showExplain.value) return
  playTone('click', game.soundEnabled)
  locked.value = false
  showExplain.value = false
  answeredOk.value = null
  submittedKeys.value = []
  selected.value = []
  canSubmitMulti.value = false
  if (qIndex.value < quizList.value.length - 1) {
    qIndex.value += 1
  } else {
    phase.value = 'run'
    showRunIntro.value = true
    running.value = false
    playTone('alarm', game.soundEnabled)
  }
}

function setMsg(text: string, tone: MsgTone = 'ok') {
  runMsg.value = text
  msgTone.value = tone
}

function stopRunLoops() {
  if (fireRaf) {
    cancelAnimationFrame(fireRaf)
    fireRaf = 0
  }
  if (smokeTimer != null) {
    window.clearInterval(smokeTimer)
    smokeTimer = null
  }
}

function startRunLoops() {
  stopRunLoops()
  const tick = (t: number) => {
    if (!running.value || done.value) {
      fireRaf = 0
      return
    }
    for (const h of hazards.value) {
      if (h.type === 'fire' && h.baseX != null) {
        h.x = h.baseX + Math.sin(t / 780) * (h.moveAmp ?? 6)
        h.radius = (h.radiusBase ?? 10) + Math.sin(t / 560) * (h.radiusPulse ?? 2)
      }
    }
    fireRaf = requestAnimationFrame(tick)
  }
  fireRaf = requestAnimationFrame(tick)

  smokeTimer = window.setInterval(() => {
    if (!running.value || done.value) return
    checkSmokeDamage()
  }, 480)
}

function startRescue() {
  if (!showRunIntro.value) return
  showRunIntro.value = false
  running.value = true
  hp.value = maxHp
  hasTowel.value = false
  towel.value.taken = false
  perfectEscape.value = true
  smokeAccum = 0
  invincibleUntil.value = 0
  playerX.value = 28
  playerY.value = 18
  setMsg('沿走廊低姿前进，避开火焰，前往楼梯安全出口', 'ok')
  playTone('click', game.soundEnabled)
  startRunLoops()
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

function takeHit(msg: string, fromX: number, fromY: number) {
  if (done.value || !running.value) return
  if (Date.now() < invincibleUntil.value) return

  hp.value -= 1
  perfectEscape.value = false
  invincibleUntil.value = Date.now() + 900
  hurtFlash.value = true
  if (hurtTimer != null) window.clearTimeout(hurtTimer)
  hurtTimer = window.setTimeout(() => {
    hurtFlash.value = false
    hurtTimer = null
  }, 900)
  const dx = playerX.value - fromX
  const dy = playerY.value - fromY
  const len = Math.hypot(dx, dy) || 1
  playerX.value = clamp(playerX.value + (dx / len) * 9, 6, 94)
  playerY.value = clamp(playerY.value + (dy / len) * 9, 8, 94)
  setMsg(msg, 'bad')
  playTone('wrong', game.soundEnabled)
  if (hp.value <= 0) finish(false)
}

function checkSmokeDamage() {
  for (const h of hazards.value) {
    if (h.type !== 'smoke') continue
    if (dist(playerX.value, playerY.value, h.x, h.y) >= h.radius) continue
    smokeAccum += hasTowel.value ? 0.32 : 0.72
    if (smokeAccum >= 1) {
      smokeAccum = 0
      takeHit(
        hasTowel.value
          ? '烟雾仍有危害，请尽快撤离到安全出口！'
          : '吸入浓烟！请拾取湿毛巾并捂口鼻低姿前进',
        h.x,
        h.y,
      )
    } else if (msgTone.value !== 'bad') {
      setMsg(
        hasTowel.value ? '已捂口鼻，请低姿尽快离开烟雾区' : '⚠️ 浓烟危险！先去拾取湿毛巾',
        'warn',
      )
    }
    return
  }
}

function onPointerDown(e: PointerEvent) {
  if (phase.value !== 'run' || done.value || showRunIntro.value) return
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  moveTo(e)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  moveTo(e)
}

function onPointerUp() {
  dragging.value = false
}

function moveTo(e: PointerEvent) {
  if (done.value || !running.value) return
  const el = document.querySelector('.run-scene') as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  const nx = clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94)
  const ny = clamp(((e.clientY - rect.top) / rect.height) * 100, 8, 94)

  const junkHit = hazards.value.find(
    (h) => h.type === 'junk' && dist(nx, ny, h.x, h.y) < h.radius,
  )
  if (junkHit) {
    setMsg('⚠️ 杂物堵住通道，请绕行！', 'warn')
    return
  }

  playerX.value = nx
  playerY.value = ny
  checkCollisions()
}

function checkCollisions() {
  if (!towel.value.taken && dist(playerX.value, playerY.value, towel.value.x, towel.value.y) < 9) {
    towel.value.taken = true
    hasTowel.value = true
    setMsg('已拾取湿毛巾：捂口鼻、低姿前进！', 'ok')
    playTone('correct', game.soundEnabled)
  }

  for (const h of hazards.value) {
    if (h.type === 'junk' || h.type === 'smoke') continue
    if (dist(playerX.value, playerY.value, h.x, h.y) >= h.radius) continue
    if (h.type === 'fire') {
      takeHit('🔥 火焰灼伤！请绕开火场前进', h.x, h.y)
      return
    }
    if (h.type === 'lift') {
      takeHit('❌ 火灾时严禁乘坐电梯！', h.x, h.y)
      return
    }
    if (h.type === 'wrong') {
      takeHit('❌ 这不是安全出口，请改走疏散楼梯！', h.x, h.y)
      return
    }
  }

  if (dist(playerX.value, playerY.value, exit.x, exit.y) < 11) {
    finish(true)
  }
}

function finish(ok: boolean) {
  if (done.value) return
  done.value = true
  running.value = false
  success.value = ok
  phase.value = 'done'
  stopRunLoops()
  const quizScore = correctCount.value * 4
  const runScore = ok ? 8 : 0
  const total = Math.min(20, quizScore + runScore)
  game.setLevelScore('escape', total)
  game.currentLevel = 3
  game.persist()
  playTone(ok ? 'success' : 'wrong', game.soundEnabled)
  if (ok) {
    setMsg(
      perfectEscape.value
        ? '成功逃生！全程无伤，逃生动作规范'
        : '成功抵达安全出口，记住绕开危险正确撤离',
      'ok',
    )
  } else {
    setMsg('逃生失败：火场中要护好自己，优先走疏散楼梯', 'bad')
  }
}

function retryRun() {
  done.value = false
  success.value = false
  dragging.value = false
  phase.value = 'run'
  runTimerKey.value += 1
  // 失败重试只重开逃生，保留答题成绩；先清掉失败分再开局
  const quizScore = correctCount.value * 4
  game.setLevelScore('escape', Math.min(20, quizScore))
  game.persist()
  showRunIntro.value = true
  running.value = false
  stopRunLoops()
  setMsg('准备重新挑战，点击开始后再次逃生', 'ok')
  playTone('click', game.soundEnabled)
}

function nextLevel() {
  router.push('/level/extinguisher')
}

onUnmounted(() => {
  dragging.value = false
  clearSubmitEnableTimer()
  stopRunLoops()
  if (hurtTimer != null) window.clearTimeout(hurtTimer)
})
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="02" title="火场逃生">
      <template #right>
        <GameTimer
          v-if="phase === 'run' || phase === 'done'"
          :key="runTimerKey"
          :seconds="28"
          :running="running"
          @timeout="finish(false)"
        />
        <span v-else class="hud-chip">判断 {{ qIndex + 1 }} / {{ quizTotal }}</span>
      </template>
    </GameHeader>

    <div v-if="phase === 'quiz'" class="quiz scene-panel">
      <p class="mission-guide quiz-guide">
        {{ multiMode ? '多选题：可点选多项后点「确认提交」' : '单选题：直接点击正确选项' }}
      </p>
      <p class="bank-tip">
        本局第 {{ qIndex + 1 }} / {{ quizTotal }} 题
        <span v-if="multiMode">（多选）</span>
      </p>
      <p class="prompt">{{ question?.prompt }}</p>
      <div class="options">
        <button
          v-for="opt in question?.options || []"
          :key="opt.key"
          class="opt"
          :class="optionClass(opt.key)"
          type="button"
          :disabled="locked || showExplain"
          @click.stop="toggleOption(opt.key)"
        >
          <b>{{ opt.key }}</b>
          <span>{{ opt.text }}</span>
        </button>
      </div>
      <GameButton
        v-if="multiMode && !showExplain"
        class="submit-multi"
        block
        label="确认提交"
        :disabled="locked || !canSubmitMulti || selected.length === 0"
        @click.stop="submitMulti"
      />
      <p v-if="multiMode && selected.length > 0 && !locked && !showExplain" class="multi-hint">
        已选 {{ selected.length }} 项，确认无误后再点提交
      </p>

      <div v-if="showExplain" class="explain-panel" :class="{ ok: answeredOk, bad: answeredOk === false }">
        <p class="explain-result">
          {{ answeredOk ? '✅ 回答正确' : '❌ 回答错误' }}
        </p>
        <p v-if="answeredOk === false" class="explain-answer">
          正确答案：<strong>{{ correctAnswerText }}</strong>
        </p>
        <p class="explain-title">知识科普</p>
        <p class="explain-body">{{ question?.knowledge }}</p>
        <GameButton
          class="explain-next"
          block
          :label="qIndex < quizTotal - 1 ? '下一题' : '进入逃生环节'"
          @click="goNextQuestion"
        />
      </div>
    </div>

    <div
      v-else-if="phase === 'run' || phase === 'done'"
      class="run-wrap"
    >
      <p class="mission-guide mission-bar">
        拖动蓝色人员 · 绕开火与障碍 · 拾取湿毛巾 · 抵达绿色安全出口
      </p>
      <div
        class="run-scene scene-panel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <GameCoachBanner :text="runMsg" :tone="msgTone" icon="🏃" />

        <div class="floor-map" aria-hidden="true">
          <div class="floor-grid" />
          <div class="zone room-fire">
            <span>起火房间</span>
          </div>
          <div class="zone hall">
            <span>疏散走廊</span>
          </div>
          <div class="zone lift-shaft">
            <span>电梯井 · 禁止</span>
          </div>
          <div class="zone stairs">
            <span>安全楼梯 EXIT</span>
          </div>
          <svg class="route-guide" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              class="route-line"
              d="M28 18 C 34 28, 42 34, 50 40 S 62 58, 68 72 S 70 82, 72 88"
              fill="none"
            />
            <polygon class="route-arrow" points="70,84 74,88 70,92 78,88" />
          </svg>
          <div class="wall w1" />
          <div class="wall w2" />
          <div class="wall w3" />
          <div class="door-gap d1" />
          <div class="door-gap d2" />
        </div>

        <SmokeEffect :density="6" />

        <div class="run-hud">
          <div class="hearts" aria-label="生命值">
            <span class="hud-label">生命</span>
            <span v-for="i in maxHp" :key="i" class="heart" :class="{ on: i <= hp }">♥</span>
          </div>
          <div class="towel-flag" :class="{ on: hasTowel }">
            {{ hasTowel ? '湿毛巾已装备' : '寻找湿毛巾' }}
          </div>
        </div>

        <div
          v-for="h in hazards.filter((x) => x.type === 'fire' || x.type === 'smoke')"
          :key="`aura-${h.id}`"
          class="danger-aura"
          :class="h.type"
          :style="{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${Math.max(16, h.radius * 2.35)}%`,
          }"
        />

        <div
          v-for="h in hazards"
          :key="h.id"
          class="icon-node obstacle"
          :class="h.type"
          :aria-label="h.label"
          :style="{
            left: `${h.x}%`,
            top: `${h.y}%`,
          }"
        >
          <FireEffect v-if="h.type === 'fire'" :intensity="0.72" />
          <EscapeIcon v-else :type="h.type" />
          <span class="node-tag">{{ h.label }}</span>
        </div>

        <div
          v-if="!towel.taken"
          class="icon-node towel"
          aria-label="湿毛巾"
          :style="{ left: `${towel.x}%`, top: `${towel.y}%` }"
        >
          <span class="towel-icon">湿</span>
          <span class="node-tag">湿毛巾</span>
        </div>

        <div
          class="icon-node exit"
          aria-label="安全出口"
          :style="{ left: `${exit.x}%`, top: `${exit.y}%` }"
        >
          <span class="exit-ring" />
          <EscapeIcon type="exit" />
          <span class="node-tag">安全出口</span>
        </div>

        <div
          class="icon-node player"
          :class="{ hurt: hurtFlash }"
          aria-label="被困人员"
          :style="{ left: `${playerX}%`, top: `${playerY}%` }"
        >
          <EscapeIcon type="victim" />
        </div>
      </div>
    </div>

    <GameModal v-if="showRunIntro" title="火场紧急逃生">
      <div class="intro-body">
        <div class="intro-icon">
          <EscapeIcon type="victim" />
        </div>
        <p class="intro-lead">火场已起火，请立刻组织逃生！</p>
        <ul class="intro-list">
          <li>拖动被困人员沿走廊前进</li>
          <li>绕开火焰与杂物，远离错误出口</li>
          <li>火灾时不要进入电梯</li>
          <li>拾取湿毛巾，捂口鼻低姿前进</li>
          <li>抵达绿色楼梯安全出口即成功</li>
        </ul>
      </div>
      <template #footer>
        <GameButton block label="开始逃生" @click="startRescue" />
      </template>
    </GameModal>

    <GameModal v-if="done" :title="success ? '成功逃生！' : '逃生失败'">
      <p>
        判断正确 {{ correctCount }} / {{ quizTotal }}，本关得分
        <strong>{{ game.levelScores.escape }}</strong> / 20
      </p>
      <p v-if="success && perfectEscape" class="knowledge-tip">全程无伤撤离，逃生动作规范。</p>
      <p v-else-if="success" class="knowledge-tip">已抵达安全出口。火场中应优先保护自身，走疏散楼梯。</p>
      <p v-else class="knowledge-tip">记住：避开烟火、不乘电梯、捂口鼻低姿，沿疏散指示撤离。</p>
      <template #footer>
        <GameButton v-if="success" block label="进入下一关" @click="nextLevel" />
        <template v-else>
          <GameButton block label="重新挑战" @click="retryRun" />
          <GameButton block variant="ghost" label="进入下一关" @click="nextLevel" />
        </template>
      </template>
    </GameModal>
  </div>
</template>

<style scoped>
.level {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: calc(16px + var(--safe-bottom));
}

.quiz {
  margin: 0 16px;
  padding: 18px 16px;
}

.quiz-guide {
  margin: 0 0 12px;
}

.bank-tip {
  margin-bottom: 8px;
  color: var(--flame-yellow);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.prompt {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
}

.options {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.opt {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
  padding: 14px 12px;
  border-radius: 12px;
  border: 1px solid rgba(22, 119, 255, 0.35);
  background: rgba(7, 26, 43, 0.55);
}

.opt.on {
  border-color: var(--fire-blue);
  background: rgba(22, 119, 255, 0.22);
}

.opt.correct {
  border-color: #43a047;
  background: rgba(67, 160, 71, 0.22);
  box-shadow: 0 0 0 1px rgba(67, 160, 71, 0.35);
}

.opt.wrong {
  border-color: #e53935;
  background: rgba(229, 57, 53, 0.2);
  box-shadow: 0 0 0 1px rgba(229, 57, 53, 0.4);
}

.opt b {
  color: var(--flame-yellow);
}

.opt span {
  color: #d7e6ff;
  line-height: 1.45;
}

.submit-multi {
  margin-top: 14px;
}

.multi-hint {
  margin-top: 8px;
  text-align: center;
  color: var(--assist-gray);
  font-size: 12px;
}

.explain-panel {
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(22, 119, 255, 0.35);
  background: rgba(7, 26, 43, 0.72);
  animation: tipCardIn 0.3s ease both;
}

.explain-panel.ok {
  border-color: rgba(67, 160, 71, 0.55);
  background: rgba(67, 160, 71, 0.12);
}

.explain-panel.bad {
  border-color: rgba(229, 57, 53, 0.55);
  background: rgba(229, 57, 53, 0.12);
}

.explain-result {
  font-size: 16px;
  font-weight: 800;
}

.explain-panel.ok .explain-result {
  color: #81c784;
}

.explain-panel.bad .explain-result {
  color: #ef9a9a;
}

.explain-answer {
  margin-top: 8px;
  color: #ffd54a;
  font-size: 14px;
}

.explain-title {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(143, 163, 184, 0.3);
  color: #9ec5ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.explain-body {
  margin-top: 8px;
  color: #d7e6ff;
  font-size: 13px;
  line-height: 1.65;
}

.explain-next {
  margin-top: 14px;
}

@keyframes tipCardIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.run-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 16px;
}

.mission-bar {
  margin: 0;
  text-align: center;
}

.run-scene {
  position: relative;
  height: min(56dvh, 480px);
  touch-action: none;
  overflow: hidden;
  border: 1px solid rgba(22, 119, 255, 0.28);
  background:
    radial-gradient(ellipse at 18% 12%, rgba(229, 57, 53, 0.32), transparent 42%),
    radial-gradient(ellipse at 78% 90%, rgba(67, 160, 71, 0.22), transparent 38%),
    linear-gradient(165deg, #1c2a40 0%, #101b2c 48%, #0a1320 100%);
}

.floor-map {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floor-grid {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(150, 180, 220, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(150, 180, 220, 0.18) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(circle at center, #000 40%, transparent 85%);
}

.route-guide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.55;
}

.route-line {
  stroke: rgba(255, 213, 74, 0.55);
  stroke-width: 1.2;
  stroke-dasharray: 3 2.5;
  stroke-linecap: round;
  animation: routeFlow 1.8s linear infinite;
}

.route-arrow {
  fill: rgba(255, 213, 74, 0.75);
}

.zone {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: grid;
  place-items: start;
  padding: 8px 10px;
  backdrop-filter: blur(1px);
}

.zone span {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(230, 240, 255, 0.62);
  font-weight: 600;
}

.room-fire {
  left: 6%;
  top: 5%;
  width: 40%;
  height: 28%;
  background: linear-gradient(160deg, rgba(229, 57, 53, 0.2), rgba(255, 120, 40, 0.08));
  box-shadow: inset 0 0 36px rgba(255, 80, 40, 0.22);
  border-color: rgba(229, 57, 53, 0.28);
}

.hall {
  left: 18%;
  top: 30%;
  width: 64%;
  height: 42%;
  background: rgba(22, 119, 255, 0.07);
  border-style: dashed;
  border-color: rgba(110, 170, 255, 0.28);
}

.lift-shaft {
  right: 5%;
  top: 42%;
  width: 22%;
  height: 28%;
  background: rgba(255, 138, 0, 0.12);
  border-color: rgba(255, 138, 0, 0.35);
}

.stairs {
  right: 10%;
  bottom: 4%;
  width: 36%;
  height: 22%;
  background: linear-gradient(160deg, rgba(67, 160, 71, 0.2), rgba(67, 160, 71, 0.08));
  border-color: rgba(67, 160, 71, 0.45);
  animation: exitPulse 2.2s ease-in-out infinite;
}

.wall {
  position: absolute;
  background: linear-gradient(90deg, rgba(160, 180, 210, 0.15), rgba(160, 180, 210, 0.35));
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.w1 {
  left: 6%;
  top: 32%;
  width: 14%;
  height: 4px;
}

.w2 {
  left: 48%;
  top: 30%;
  width: 4px;
  height: 18%;
}

.w3 {
  right: 26%;
  top: 68%;
  width: 18%;
  height: 4px;
}

.door-gap {
  position: absolute;
  background: rgba(255, 213, 74, 0.28);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 213, 74, 0.25);
}

.d1 {
  left: 22%;
  top: 31%;
  width: 10%;
  height: 6px;
}

.d2 {
  right: 28%;
  top: 70%;
  width: 8%;
  height: 6px;
}

.run-hud {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

.hearts,
.towel-flag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(7, 26, 43, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
}

.hud-label {
  color: var(--assist-gray);
  font-size: 11px;
  margin-right: 2px;
}

.heart {
  color: rgba(255, 255, 255, 0.22);
  font-size: 14px;
  line-height: 1;
}

.heart.on {
  color: #e53935;
  text-shadow: 0 0 8px rgba(229, 57, 53, 0.55);
}

.towel-flag {
  color: var(--assist-gray);
  font-size: 11px;
}

.towel-flag.on {
  border-color: rgba(22, 119, 255, 0.55);
  color: #9ec5ff;
}

.danger-aura {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  aspect-ratio: 1;
  border-radius: 50%;
  pointer-events: none;
  border: 1.5px dashed rgba(229, 57, 53, 0.42);
  background: radial-gradient(circle, rgba(229, 57, 53, 0.16), transparent 70%);
  animation: ringPulse 1.5s ease-in-out infinite;
}

.danger-aura.smoke {
  border-color: rgba(176, 190, 210, 0.45);
  background: radial-gradient(circle, rgba(140, 160, 180, 0.16), transparent 70%);
}

.icon-node {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(7, 26, 43, 0.78);
  border: 1.5px solid rgba(143, 163, 184, 0.35);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  display: grid;
  place-items: center;
}

.node-tag {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(7, 26, 43, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #d7e6ff;
  font-size: 10px;
  line-height: 1.2;
  pointer-events: none;
}

.icon-node.fire {
  width: auto;
  height: auto;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  z-index: 2;
}

.icon-node.smoke {
  border-color: rgba(143, 163, 184, 0.55);
}

.icon-node.lift,
.icon-node.wrong {
  border-color: rgba(255, 138, 0, 0.65);
}

.icon-node.junk {
  border-color: rgba(141, 110, 99, 0.75);
}

.icon-node.towel {
  border-color: rgba(22, 119, 255, 0.65);
  background: rgba(22, 119, 255, 0.18);
  animation: towelBob 1.6s ease-in-out infinite;
  z-index: 3;
}

.towel-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #e3f2fd, #90caf9);
  color: #0d47a1;
  font-size: 13px;
  font-weight: 800;
}

.icon-node.exit {
  width: 56px;
  height: 56px;
  border-color: rgba(67, 160, 71, 0.85);
  box-shadow: 0 0 18px rgba(67, 160, 71, 0.4);
  z-index: 3;
}

.exit-ring {
  position: absolute;
  inset: -10px;
  border-radius: 18px;
  border: 1.5px solid rgba(67, 160, 71, 0.45);
  animation: exitPulse 2s ease-in-out infinite;
  pointer-events: none;
}

.icon-node.player {
  z-index: 4;
  width: 54px;
  height: 54px;
  border-color: rgba(22, 119, 255, 0.85);
  box-shadow:
    0 0 0 3px rgba(22, 119, 255, 0.15),
    0 0 16px rgba(22, 119, 255, 0.45);
}

.icon-node.player.hurt {
  animation: hurtFlash 0.35s ease;
}

.intro-body {
  text-align: center;
}

.intro-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 12px;
  padding: 6px;
  border-radius: 16px;
  background: rgba(7, 26, 43, 0.65);
  border: 1px solid rgba(255, 138, 0, 0.45);
  box-shadow: 0 0 18px rgba(229, 57, 53, 0.25);
}

.intro-lead {
  color: var(--flame-yellow);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
}

.intro-list {
  margin: 12px auto 0;
  padding-left: 1.2em;
  text-align: left;
  color: #d7e6ff;
  font-size: 13px;
  line-height: 1.7;
  max-width: 280px;
}

@keyframes exitPulse {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(67, 160, 71, 0.3);
    opacity: 0.85;
  }
  50% {
    box-shadow: 0 0 22px rgba(67, 160, 71, 0.55);
    opacity: 1;
  }
}

@keyframes towelBob {
  50% {
    transform: translate(-50%, calc(-50% - 3px));
  }
}

@keyframes hurtFlash {
  50% {
    filter: brightness(1.4);
    border-color: #e53935;
  }
}

@keyframes routeFlow {
  to {
    stroke-dashoffset: -11;
  }
}

@keyframes ringPulse {
  0%,
  100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(0.96);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.05);
  }
}
</style>
