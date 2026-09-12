import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadGameState, saveGameState } from '@/utils/storage'

export interface LevelScores {
  hazard: number
  escape: number
  extinguisher: number
  alarm: number
  rescue: number
}

const emptyScores = (): LevelScores => ({
  hazard: 0,
  escape: 0,
  extinguisher: 0,
  alarm: 0,
  rescue: 0,
})

export const useGameStore = defineStore('game', () => {
  const score = ref(0)
  const currentLevel = ref(0)
  const levelScores = ref<LevelScores>(emptyScores())
  const hazardFound = ref(0)
  const escapeCorrect = ref(0)
  const extinguisherSuccess = ref(false)
  const alarmSuccess = ref(false)
  const rescuedPeople = ref(0)
  const soundEnabled = ref(true)
  const gameStarted = ref(false)
  const gameCompleted = ref(false)
  const startTime = ref<number | null>(null)
  const endTime = ref<number | null>(null)
  const userName = ref('')

  const durationSeconds = computed(() => {
    if (!startTime.value) return 0
    const end = endTime.value ?? Date.now()
    return Math.max(0, Math.round((end - startTime.value) / 1000))
  })

  const rank = computed(() => {
    const s = score.value
    if (s >= 90) return '安全先锋'
    if (s >= 75) return '防火能手'
    if (s >= 60) return '安全学员'
    return '安全新兵'
  })

  function persist() {
    saveGameState({
      score: score.value,
      currentLevel: currentLevel.value,
      levelScores: { ...levelScores.value },
      hazardFound: hazardFound.value,
      escapeCorrect: escapeCorrect.value,
      extinguisherSuccess: extinguisherSuccess.value,
      alarmSuccess: alarmSuccess.value,
      rescuedPeople: rescuedPeople.value,
      soundEnabled: soundEnabled.value,
      gameStarted: gameStarted.value,
      gameCompleted: gameCompleted.value,
      startTime: startTime.value,
      endTime: endTime.value,
      userName: userName.value,
    })
  }

  function hydrate() {
    const saved = loadGameState()
    if (!saved) return
    score.value = saved.score
    currentLevel.value = saved.currentLevel
    levelScores.value = { ...emptyScores(), ...saved.levelScores }
    hazardFound.value = saved.hazardFound
    escapeCorrect.value = saved.escapeCorrect
    extinguisherSuccess.value = saved.extinguisherSuccess
    alarmSuccess.value = saved.alarmSuccess
    rescuedPeople.value = saved.rescuedPeople
    soundEnabled.value = saved.soundEnabled
    gameStarted.value = saved.gameStarted
    gameCompleted.value = saved.gameCompleted
    startTime.value = saved.startTime
    endTime.value = saved.endTime
    userName.value = saved.userName || ''
  }

  function startGame() {
    score.value = 0
    currentLevel.value = 1
    levelScores.value = emptyScores()
    hazardFound.value = 0
    escapeCorrect.value = 0
    extinguisherSuccess.value = false
    alarmSuccess.value = false
    rescuedPeople.value = 0
    gameStarted.value = true
    gameCompleted.value = false
    startTime.value = Date.now()
    endTime.value = null
    persist()
  }

  function setLevelScore(level: keyof LevelScores, value: number) {
    levelScores.value[level] = value
    score.value = Object.values(levelScores.value).reduce((a, b) => a + b, 0)
    persist()
  }

  function completeGame() {
    gameCompleted.value = true
    endTime.value = Date.now()
    persist()
  }

  function setUserName(name: string) {
    userName.value = name.trim()
    persist()
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    persist()
  }

  function resetAll() {
    score.value = 0
    currentLevel.value = 0
    levelScores.value = emptyScores()
    hazardFound.value = 0
    escapeCorrect.value = 0
    extinguisherSuccess.value = false
    alarmSuccess.value = false
    rescuedPeople.value = 0
    gameStarted.value = false
    gameCompleted.value = false
    startTime.value = null
    endTime.value = null
    // keep userName for convenience
    persist()
  }

  return {
    score,
    currentLevel,
    levelScores,
    hazardFound,
    escapeCorrect,
    extinguisherSuccess,
    alarmSuccess,
    rescuedPeople,
    soundEnabled,
    gameStarted,
    gameCompleted,
    startTime,
    endTime,
    userName,
    durationSeconds,
    rank,
    hydrate,
    startGame,
    setLevelScore,
    completeGame,
    setUserName,
    toggleSound,
    resetAll,
    persist,
  }
})
