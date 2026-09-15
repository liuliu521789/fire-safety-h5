import { createRouter, createWebHashHistory } from 'vue-router'
import { LEVELS } from '@/data/levels'
import { useGameStore } from '@/stores/game'

const levelNeed: Record<string, number> = {
  hazard: 1,
  escape: 2,
  extinguisher: 3,
  alarm: 4,
  rescue: 5,
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/home', redirect: '/' },
    { path: '/level/hazard', name: 'hazard', component: () => import('@/views/HazardView.vue') },
    { path: '/level/escape', name: 'escape', component: () => import('@/views/EscapeView.vue') },
    {
      path: '/level/extinguisher',
      name: 'extinguisher',
      component: () => import('@/views/ExtinguisherView.vue'),
    },
    { path: '/level/alarm', name: 'alarm', component: () => import('@/views/AlarmView.vue') },
    { path: '/level/rescue', name: 'rescue', component: () => import('@/views/RescueView.vue') },
    { path: '/result', name: 'result', component: () => import('@/views/ResultView.vue') },
    {
      path: '/certificate',
      name: 'certificate',
      component: () => import('@/views/CertificateView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

function allowedLevelRoute(currentLevel: number) {
  const meta = LEVELS.find((l) => l.id === currentLevel)
  return meta?.route ?? '/'
}

router.beforeEach((to) => {
  const game = useGameStore()

  if (to.name === 'home') return true

  // 分享链接带成绩快照，允许直接打开证书
  if (to.name === 'certificate') {
    const hasSnap = typeof to.query.c === 'string' && !!to.query.c
    if (hasSnap) return true
    if (game.gameCompleted && game.userName) return true
    if (game.gameCompleted) return { path: '/result' }
    return { path: '/' }
  }

  if (to.name === 'result') {
    if (game.gameCompleted) return true
    return { path: '/' }
  }

  const need = to.name ? levelNeed[String(to.name)] : undefined
  if (need != null) {
    if (!game.gameStarted) return { path: '/' }
    if (game.currentLevel < need) {
      return { path: allowedLevelRoute(Math.max(1, game.currentLevel)) }
    }
  }

  return true
})

export default router
