import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useGameStore } from '@/stores/game'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
useGameStore().hydrate()
app.use(router)
app.mount('#app')
