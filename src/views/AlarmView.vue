<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameButton from '@/components/GameButton.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameModal from '@/components/GameModal.vue'
import { useGameStore } from '@/stores/game'
import { playTone } from '@/utils/sound'
import { speak, speakSequence, stopSpeak } from '@/utils/speech'

const router = useRouter()
const game = useGameStore()

const stage = ref<'dial' | 'what' | 'where' | 'people' | 'calling' | 'done'>('dial')
const dial = ref('')
const what = ref('')
const where = ref('')
const people = ref('')
const dialError = ref('')
const subtitle = ref('')

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const

const canSubmitInfo = computed(() => what.value === '火灾' && !!where.value && !!people.value)

async function announce(display: string, voice?: string, rate = 1) {
  subtitle.value = display
  await speak(voice ?? display, game.soundEnabled, rate)
}

onMounted(() => {
  void announce(
    '火警报警演练开始，请拨打正确的火警电话。',
    '火警报警演练开始，请拨打正确的火警电话。',
  )
})

onUnmounted(() => {
  stopSpeak()
})

function press(key: string) {
  if (stage.value !== 'dial') return
  if (key === '*' || key === '#') return
  if (dial.value.length >= 3) return
  playTone('click', game.soundEnabled)
  dial.value += key
  dialError.value = ''
}

function backspace() {
  dial.value = dial.value.slice(0, -1)
  dialError.value = ''
}

async function call() {
  if (dial.value === '119') {
    playTone('correct', game.soundEnabled)
    stage.value = 'what'
    await announce(
      '火警电话已接通。您好，消防救援指挥中心，请问发生了什么情况？',
      '火警电话已接通。您好，消防救援指挥中心，请问发生了什么情况？',
    )
  } else {
    playTone('wrong', game.soundEnabled)
    dialError.value = '号码不正确，请拨打正确的火警电话'
    await announce(
      '号码不正确，请拨打正确的火警电话。',
      '号码不正确，请拨打正确的火警电话。',
    )
  }
}

async function chooseWhat(v: string) {
  what.value = v
  playTone('click', game.soundEnabled)
  if (v === '火灾') {
    stage.value = 'where'
    await announce('收到，发生火灾。请问发生在哪里？小区、商场，还是工厂？')
  } else {
    playTone('wrong', game.soundEnabled)
    await announce('这里是火警专线，请报告火灾相关情况。')
  }
}

async function chooseWhere(v: string) {
  where.value = v
  playTone('click', game.soundEnabled)
  stage.value = 'people'
  await announce(`地点已记录，发生在${v}。请问是否有人被困？`)
}

async function choosePeople(v: string) {
  people.value = v
  playTone('click', game.soundEnabled)
  await announce(`人员情况已记录，${v === '有' ? '有人被困' : v === '没有' ? '无人被困' : '人员情况暂不清楚'}。请确认报警信息。`)
}

async function submitReport() {
  if (!canSubmitInfo.value) {
    playTone('wrong', game.soundEnabled)
    await announce('请完整填写火灾地点和人员情况后再提交。')
    return
  }
  stage.value = 'calling'
  playTone('alarm', game.soundEnabled)
  const lines = [
    '信息已接收。',
    `${where.value}发生火灾，${people.value === '有' ? '有人员被困' : people.value === '没有' ? '暂无人被困' : '人员情况不清楚'}。`,
    '消防车正在赶赴现场，请保持电话畅通，注意自身安全。',
  ]
  await speakSequence(lines, game.soundEnabled, 180, (line) => {
    subtitle.value = line
  })
  finish(true)
}

function finish(ok: boolean) {
  stage.value = 'done'
  game.alarmSuccess = ok
  game.setLevelScore('alarm', ok ? 15 : 5)
  game.currentLevel = 5
  game.persist()
  playTone(ok ? 'success' : 'wrong', game.soundEnabled)
  if (ok) {
    void announce('报警成功。报警时应尽量说清楚发生地点、火灾情况和人员情况。')
  }
}

function nextLevel() {
  stopSpeak()
  router.push('/level/rescue')
}
</script>

<template>
  <div class="game-shell level">
    <GameHeader code="04" title="紧急报警" right-text="报警" />

    <div class="phone scene-panel">
      <template v-if="stage === 'dial'">
        <p class="task">请拨打正确的火警电话</p>
        <div class="screen">{{ dial || '输入号码' }}</div>
        <div class="pad">
          <button v-for="k in keys" :key="k" type="button" @click="press(k)">{{ k }}</button>
        </div>
        <div class="actions">
          <GameButton variant="ghost" label="删除" @click="backspace" />
          <GameButton label="呼叫" @click="call" />
        </div>
        <p v-if="dialError" class="err">{{ dialError }}</p>
      </template>

      <template v-else-if="stage === 'what'">
        <p class="task">发生了什么？</p>
        <div class="choices">
          <button
            v-for="item in ['火灾', '交通事故', '人员走失']"
            :key="item"
            type="button"
            :class="{ on: what === item }"
            @click="chooseWhat(item)"
          >
            {{ item }}
          </button>
        </div>
      </template>

      <template v-else-if="stage === 'where'">
        <p class="task">发生在哪里？</p>
        <div class="choices">
          <button
            v-for="item in ['小区', '商场', '工厂']"
            :key="item"
            type="button"
            :class="{ on: where === item }"
            @click="chooseWhere(item)"
          >
            {{ item }}
          </button>
        </div>
      </template>

      <template v-else-if="stage === 'people'">
        <p class="task">是否有人被困？</p>
        <div class="choices">
          <button
            v-for="item in ['有', '没有', '不清楚']"
            :key="item"
            type="button"
            :class="{ on: people === item }"
            @click="choosePeople(item)"
          >
            {{ item }}
          </button>
        </div>
        <GameButton
          class="submit"
          block
          label="确认报警信息"
          :disabled="!canSubmitInfo"
          @click="submitReport"
        />
      </template>

      <template v-else-if="stage === 'calling'">
        <div class="calling">
          <div class="icon">📞</div>
          <h3>接警中</h3>
          <p>正在接通消防救援指挥中心……</p>
        </div>
      </template>

      <p v-if="subtitle" class="subtitle">🔊 {{ subtitle }}</p>
    </div>

    <GameModal v-if="stage === 'done'" title="报警成功">
      <p>📞 火警电话已接通</p>
      <p class="knowledge-tip">
        报警时应尽量说清楚发生地点、火灾情况、人员情况等重要信息。
      </p>
      <template #footer>
        <GameButton block label="进入最终关卡" @click="nextLevel" />
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

.phone {
  margin: 8px 16px 0;
  padding: 18px 16px 20px;
}

.task {
  text-align: center;
  font-weight: 700;
  margin-bottom: 14px;
}

.screen {
  min-height: 52px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(22, 119, 255, 0.3);
  font-size: 28px;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
  margin-bottom: 16px;
}

.pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.pad button {
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(143, 163, 184, 0.25);
  font-size: 20px;
  font-weight: 700;
}

.actions {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
}

.err {
  margin-top: 10px;
  text-align: center;
  color: #ffb4b0;
  font-size: 13px;
}

.choices {
  display: grid;
  gap: 10px;
}

.choices button {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(22, 119, 255, 0.3);
  background: rgba(7, 26, 43, 0.5);
  text-align: left;
  font-weight: 600;
}

.choices button.on {
  border-color: var(--fire-blue);
  background: rgba(22, 119, 255, 0.22);
}

.submit {
  margin-top: 16px;
}

.calling {
  text-align: center;
  padding: 36px 0;
}

.calling .icon {
  font-size: 42px;
}

.calling h3 {
  margin-top: 8px;
  font-size: 32px;
  color: var(--flame-yellow);
}

.calling p {
  margin-top: 8px;
  color: var(--assist-gray);
}

.subtitle {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(22, 119, 255, 0.12);
  border: 1px solid rgba(22, 119, 255, 0.28);
  color: #d7e6ff;
  font-size: 13px;
  line-height: 1.5;
}
</style>
