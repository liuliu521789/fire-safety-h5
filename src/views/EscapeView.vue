<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EscapeIcon from '@/components/EscapeIcon.vue'
import GameButton from '@/components/GameButton.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import GameTimer from '@/components/GameTimer.vue'
import SmokeEffect from '@/components/SmokeEffect.vue'
import {
  ESCAPE_QUIZ_COUNT,
  checkEscapeAnswer,
  isMultiQuestion,
  pickEscapeQuestions,
} from '@/data/questions'
import { useGameStore } from '@/stores/game'
import { clamp } from '@/utils/game'
import { playTone } from '@/utils/sound'

const router = useRouter()
const game = useGameStore()

const quizList = ref(pickEscapeQuestions(ESCAPE_QUIZ_COUNT))
const phase = ref<'quiz' | 'run' | 'done'>('quiz')
const qIndex = ref(0)
const correctCount = ref(0)
const knowledge = ref('')
const locked = ref(false)
const selected = ref<string[]>([])
const runMsg = ref('拖动被困人员，避开危险图标，到达安全出口')
const playerX = ref(50)
const playerY = ref(12)
const running = ref(false)
const showRunIntro = ref(false)
const success = ref(false)
const done = ref(false)
const dragging = ref(false)

const question = computed(() => quizList.value[qIndex.value])
const quizTotal = computed(() => quizList.value.length)
const multiMode = computed(() => (question.value ? isMultiQuestion(question.value) : false))

const hazards = [
  { id: 'fire1', x: 22, y: 38, label: '火焰', type: 'fire' as const },
  { id: 'smoke1', x: 68, y: 48, label: '烟雾', type: 'smoke' as const },
  { id: 'junk', x: 40, y: 58, label: '杂物', type: 'junk' as const },
  { id: 'lift', x: 78, y: 68, label: '电梯', type: 'lift' as const },
  { id: 'wrong', x: 18, y: 78, label: '错误出口', type: 'wrong' as const },
]

const exit = { x: 55, y: 88 }

function toggleOption(key: string) {
  if (locked.value || !question.value) return
  if (!multiMode.value) {
    submitAnswer([key])
    return
  }
  playTone('click', game.soundEnabled)
  if (selected.value.includes(key)) {
    selected.value = selected.value.filter((k) => k !== key)
  } else {
    selected.value = [...selected.value, key]
  }
}

function submitMulti() {
  if (locked.value || selected.value.length === 0) return
  submitAnswer([...selected.value])
}

function submitAnswer(keys: string[]) {
  if (locked.value || !question.value) return
  locked.value = true
  const ok = checkEscapeAnswer(question.value, keys)
  if (ok) {
    correctCount.value += 1
    playTone('correct', game.soundEnabled)
  } else {
    playTone('wrong', game.soundEnabled)
  }
  knowledge.value = question.value.knowledge
  game.escapeCorrect = correctCount.value
  game.persist()

  window.setTimeout(() => {
    locked.value = false
    knowledge.value = ''
    selected.value = []
    if (qIndex.value < quizList.value.length - 1) {
      qIndex.value += 1
    } else {
      phase.value = 'run'
      showRunIntro.value = true
      running.value = false
      playTone('alarm', game.soundEnabled)
    }
  }, 1100)
}

function startRescue() {
  if (!showRunIntro.value) return
  showRunIntro.value = false
  running.value = true
  playTone('click', game.soundEnabled)
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
  const el = document.querySelector('.run-scene') as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  playerX.value = clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94)
  playerY.value = clamp(((e.clientY - rect.top) / rect.height) * 100, 8, 94)
  checkCollision()
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

function checkCollision() {
  for (const h of hazards) {
    if (dist(playerX.value, playerY.value, h.x, h.y) < 10) {
      if (h.type === 'fire' || h.type === 'smoke') {
        runMsg.value = '⚠️ 注意火焰与烟雾！'
        playTone('wrong', game.soundEnabled)
      } else if (h.type === 'lift') {
        runMsg.value = '❌ 火灾时不要乘坐电梯。'
        playTone('wrong', game.soundEnabled)
      } else if (h.type === 'wrong') {
        runMsg.value = '❌ 这不是安全出口。'
        playTone('wrong', game.soundEnabled)
      } else {
        runMsg.value = '⚠️ 前方有障碍，绕行！'
      }
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
  const quizScore = correctCount.value * 4
  const runScore = ok ? 8 : 0
  const total = Math.min(20, quizScore + runScore)
  game.setLevelScore('escape', total)
  game.currentLevel = 3
  game.persist()
  playTone(ok ? 'success' : 'wrong', game.soundEnabled)
  runMsg.value = ok ? '🚨 成功逃生！' : '逃生失败，记住安全路线'
}

function nextLevel() {
  router.push('/level/extinguisher')
}

onUnmounted(() => {
  dragging.value = false
})
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="02" title="火场逃生">
      <template #right>
        <GameTimer
          v-if="phase === 'run'"
          :seconds="20"
          :running="running"
          @timeout="finish(false)"
        />
        <span v-else class="hud-chip">判断 {{ qIndex + 1 }} / {{ quizTotal }}</span>
      </template>
    </GameHeader>

    <div v-if="phase === 'quiz'" class="quiz scene-panel">
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
          :class="{ on: selected.includes(opt.key) }"
          type="button"
          :disabled="locked"
          @click="toggleOption(opt.key)"
        >
          <b>{{ opt.key }}</b>
          <span>{{ opt.text }}</span>
        </button>
      </div>
      <GameButton
        v-if="multiMode"
        class="submit-multi"
        block
        label="确认提交"
        :disabled="locked || selected.length === 0"
        @click="submitMulti"
      />
      <div v-if="knowledge" class="knowledge-tip">{{ knowledge }}</div>
    </div>

    <div
      v-else-if="phase === 'run' || phase === 'done'"
      class="run-scene scene-panel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <SmokeEffect :density="5" />
      <div class="path-label room">房间</div>
      <div class="path-label hall">走廊</div>
      <div class="path-label stair">楼梯</div>

      <div
        v-for="h in hazards"
        :key="h.id"
        class="icon-node obstacle"
        :class="h.type"
        :aria-label="h.label"
        :style="{ left: `${h.x}%`, top: `${h.y}%` }"
      >
        <EscapeIcon :type="h.type" />
      </div>

      <div
        class="icon-node exit"
        aria-label="安全出口"
        :style="{ left: `${exit.x}%`, top: `${exit.y}%` }"
      >
        <EscapeIcon type="exit" />
      </div>

      <div
        class="icon-node player"
        aria-label="被困人员"
        :style="{ left: `${playerX}%`, top: `${playerY}%` }"
      >
        <EscapeIcon type="victim" />
      </div>

      <p class="run-msg">{{ runMsg }}</p>
    </div>

    <GameModal v-if="showRunIntro" title="火场紧急救援">
      <div class="intro-body">
        <div class="intro-icon">
          <EscapeIcon type="victim" />
        </div>
        <p class="intro-lead">现有一名人员被困火场！</p>
        <p class="intro-desc">
          请帮助他安全逃生：拖动被困人员图标，避开火焰、烟雾、电梯等危险，抵达安全出口。
        </p>
      </div>
      <template #footer>
        <GameButton block label="开始救援" @click="startRescue" />
      </template>
    </GameModal>

    <GameModal v-if="done" :title="success ? '成功逃生！' : '本关结束'">
      <p>
        判断正确 {{ correctCount }} / {{ quizTotal }}，本关得分
        <strong>{{ game.levelScores.escape }}</strong> / 20
      </p>
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
  gap: 12px;
  padding-bottom: calc(16px + var(--safe-bottom));
}

.quiz {
  margin: 0 16px;
  padding: 18px 16px;
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

.run-scene {
  position: relative;
  margin: 0 16px;
  height: min(62dvh, 520px);
  touch-action: none;
  overflow: hidden;
  background: linear-gradient(180deg, #1a3048, #0b1a2a);
}

.path-label {
  position: absolute;
  font-size: 11px;
  color: rgba(215, 230, 255, 0.4);
  letter-spacing: 0.12em;
}

.room {
  left: 10%;
  top: 8%;
}
.hall {
  left: 42%;
  top: 36%;
}
.stair {
  left: 60%;
  top: 70%;
}

.icon-node {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(7, 26, 43, 0.72);
  border: 1.5px solid rgba(143, 163, 184, 0.35);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}

.icon-node.fire,
.icon-node.smoke {
  border-color: rgba(229, 57, 53, 0.65);
  box-shadow: 0 0 12px rgba(229, 57, 53, 0.3);
}

.icon-node.lift,
.icon-node.wrong {
  border-color: rgba(255, 138, 0, 0.6);
}

.icon-node.junk {
  border-color: rgba(141, 110, 99, 0.7);
}

.icon-node.exit {
  width: 54px;
  height: 54px;
  border-color: rgba(67, 160, 71, 0.75);
  box-shadow: 0 0 14px rgba(67, 160, 71, 0.35);
}

.icon-node.player {
  z-index: 3;
  width: 52px;
  height: 52px;
  border-color: rgba(22, 119, 255, 0.75);
  box-shadow: 0 0 14px rgba(22, 119, 255, 0.45);
}

.run-msg {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 4;
  text-align: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(7, 26, 43, 0.75);
  font-size: 13px;
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

.intro-desc {
  margin-top: 10px;
  color: #d7e6ff;
  font-size: 13px;
  line-height: 1.6;
}
</style>
