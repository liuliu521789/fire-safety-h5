<script setup lang="ts">
import html2canvas from 'html2canvas'
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionCertificate from '@/components/ActionCertificate.vue'
import GameButton from '@/components/GameButton.vue'
import { useGameStore } from '@/stores/game'
import { shareChallenge } from '@/utils/share'
import { playTone } from '@/utils/sound'

const router = useRouter()
const game = useGameStore()
const tip = ref('')
const downloading = ref(false)
const certRef = ref<HTMLElement | null>(null)

onMounted(() => {
  game.hydrate()
  if (!game.userName) {
    router.replace('/result')
  }
})

async function share() {
  const result = await shareChallenge(game.score)
  if (result === true) tip.value = '已调起系统分享'
  else if (result === 'copied') tip.value = '挑战文案已复制到剪贴板'
  else tip.value = '当前环境暂不支持分享，可下载或截图保存安全证书'
}

async function downloadCert() {
  if (!certRef.value || downloading.value) return
  downloading.value = true
  tip.value = '正在生成图片…'
  playTone('click', game.soundEnabled)
  try {
    await nextTick()
    const canvas = await html2canvas(certRef.value, {
      backgroundColor: '#efe9dc',
      scale: Math.min(3, window.devicePixelRatio || 2),
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    const safeName = (game.userName || '用户').replace(/[\\/:*?"<>|]/g, '')
    link.download = `消防安全证书-${safeName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    tip.value = '证书已下载为图片'
    playTone('success', game.soundEnabled)
  } catch {
    tip.value = '下载失败，请尝试截图保存'
    playTone('wrong', game.soundEnabled)
  } finally {
    downloading.value = false
  }
}

function retry() {
  game.resetAll()
  router.push('/home')
}
</script>

<template>
  <div class="game-shell cert-page">
    <div class="wrap">
      <div ref="certRef" class="cert-capture">
        <ActionCertificate
          :score="game.score"
          :rank="game.rank"
          :duration="game.durationSeconds"
          :user-name="game.userName"
        />
      </div>

      <div class="actions">
        <GameButton
          block
          :label="downloading ? '生成中…' : '下载证书图片'"
          :disabled="downloading"
          @click="downloadCert"
        />
        <GameButton block variant="ghost" label="分享挑战" @click="share" />
        <GameButton block variant="ghost" label="重新挑战" @click="retry" />
      </div>
      <p v-if="tip" class="tip">{{ tip }}</p>
    </div>
  </div>
</template>

<style scoped>
.cert-page {
  padding: 20px 16px calc(28px + var(--safe-bottom));
}

.wrap {
  position: relative;
  z-index: 1;
  max-width: 420px;
  margin: 0 auto;
}

.cert-capture {
  border-radius: 8px;
}

.actions {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.tip {
  margin-top: 12px;
  text-align: center;
  color: var(--assist-gray);
  font-size: 12px;
}
</style>
