export interface PersistedGameState {
  score: number
  currentLevel: number
  levelScores: {
    hazard: number
    escape: number
    extinguisher: number
    alarm: number
    rescue: number
  }
  hazardFound: number
  escapeCorrect: number
  extinguisherSuccess: boolean
  alarmSuccess: boolean
  rescuedPeople: number
  soundEnabled: boolean
  gameStarted: boolean
  gameCompleted: boolean
  startTime: number | null
  endTime: number | null
  userName: string
}

const KEY = 'fire-safety-h5-game'
const VISITED_KEY = 'fire-safety-h5-visited'

export function loadGameState(): PersistedGameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedGameState
  } catch {
    return null
  }
}

export function saveGameState(state: PersistedGameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}

export function clearGameState() {
  localStorage.removeItem(KEY)
}

export function hasVisitedBefore(): boolean {
  return localStorage.getItem(VISITED_KEY) === '1'
}

export function markVisited() {
  localStorage.setItem(VISITED_KEY, '1')
}
