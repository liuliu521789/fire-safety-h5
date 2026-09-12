import { createRouter, createWebHashHistory } from 'vue-router'

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

export default router
