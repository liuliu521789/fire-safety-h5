<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameButton from '@/components/GameButton.vue'
import GameModal from '@/components/GameModal.vue'
import SoundToggle from '@/components/SoundToggle.vue'
import { LEVELS } from '@/data/levels'
import { useGameStore } from '@/stores/game'
import { encodeCertSnapshot } from '@/utils/certShare'
import { formatTime, scoreLabel } from '@/utils/game'
import { playTone } from '@/utils/sound'

const router = useRouter()
const game = useGameStore()
const showNameModal = ref(false)
const nameInput = ref('')
const nameError = ref('')

onMounted(() => {
  game.hydrate()
  nameInput.value = game.userName || ''
})

function openNameModal() {
  nameInput.value = game.userName || ''
  nameError.value = ''
  showNameModal.value = true
  playTone('click', game.soundEnabled)
}

function confirmName() {
  const name = nameInput.value.trim()
  if (!name) {
    nameError.value = '请输入您的姓名'
    playTone('wrong', game.soundEnabled)
    return
  }
  if (name.length > 12) {
    nameError.value = '姓名请控制在 12 个字以内'
    playTone('wrong', game.soundEnabled)
    return
  }
  game.setUserName(name)
  showNameModal.value = false
  playTone('correct', game.soundEnabled)
  const c = encodeCertSnapshot(game.buildCertSnapshot())
  router.push({ path: '/certificate', query: { c } })
}

function retry() {
  game.resetAll()
  router.push('/home')
}
</script>

<template>
  <div class="game-shell result">
    <div class="page-top">
      <SoundToggle />
    </div>
    <div class="content">
      <p class="eyebrow">MISSION REPORT</p>
      <h1>消防安全能力报告</h1>
      <p class="sub">综合评分 · {{ scoreLabel(game.score) }}</p>

      <div class="score-card scene-panel">
        <div class="big">{{ game.score }}</div>
        <div class="meta">
          <span>评级：{{ game.rank }}</span>
          <span>用时：{{ formatTime(game.durationSeconds) }}</span>
        </div>
      </div>

      <ul class="levels">
        <li v-for="lv in LEVELS" :key="lv.key">
          <span>{{ lv.code }} {{ lv.title }}</span>
          <b>{{ game.levelScores[lv.key] }} / {{ lv.maxScore }}</b>
        </li>
      </ul>

      <div class="actions">
        <GameButton block label="生成证书" @click="openNameModal" />
        <GameButton block variant="ghost" label="重新挑战" @click="retry" />
      </div>
    </div>

    <GameModal v-if="showNameModal" title="填写证书姓名" closable @close="showNameModal = false">
      <p class="hint">请输入您的姓名，将显示在证书上。</p>
      <input
        v-model="nameInput"
        class="name-input"
        type="text"
        maxlength="12"
        placeholder="请输入姓名"
        enterkeyhint="done"
        @keyup.enter="confirmName"
      />
      <p v-if="nameError" class="err">{{ nameError }}</p>
      <template #footer>
        <GameButton block label="确认并生成证书" @click="confirmName" />
        <GameButton block variant="ghost" label="取消" @click="showNameModal = false" />
      </template>
    </GameModal>
  </div>
</template>

<style scoped>
.result {
  padding: 24px 16px calc(28px + var(--safe-bottom));
}

.page-top {
  display: flex;
  justify-content: flex-end;
  margin: -8px 0 8px;
}

.content {
  position: relative;
  z-index: 1;
}

.eyebrow {
  color: var(--flame-yellow);
  font-size: 11px;
  letter-spacing: 0.2em;
}

h1 {
  margin-top: 8px;
  font-size: 26px;
}

.sub {
  margin-top: 6px;
  color: var(--assist-gray);
  font-size: 13px;
}

.score-card {
  margin-top: 18px;
  padding: 18px;
  text-align: center;
}

.big {
  font-size: 56px;
  font-weight: 900;
  color: var(--flame-yellow);
  line-height: 1;
}

.meta {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 16px;
  color: var(--assist-gray);
  font-size: 13px;
}

.levels {
  list-style: none;
  margin: 16px 0 22px;
  display: grid;
  gap: 10px;
}

.levels li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(22, 119, 255, 0.2);
  font-size: 13px;
}

.levels b {
  color: #d7e6ff;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: grid;
  gap: 10px;
}

.hint {
  margin-bottom: 12px;
  text-align: center;
  color: var(--assist-gray);
  font-size: 13px;
}

.name-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(22, 119, 255, 0.4);
  background: rgba(7, 26, 43, 0.75);
  color: #fff;
  font-size: 16px;
  outline: none;
}

.name-input:focus {
  border-color: var(--fire-blue);
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.2);
}

.err {
  margin-top: 8px;
  color: #ffb4b0;
  font-size: 12px;
  text-align: center;
}
</style>
