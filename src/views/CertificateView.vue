<script setup lang="ts">
import html2canvas from 'html2canvas'
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionCertificate from '@/components/ActionCertificate.vue'
import GameButton from '@/components/GameButton.vue'
import SoundToggle from '@/components/SoundToggle.vue'
import { useGameStore } from '@/stores/game'
import {
  buildCertShareUrl,
  decodeCertSnapshot,
  encodeCertSnapshot,
  isWeChat,
} from '@/utils/certShare'
import { canvasToDataUrl, tryDownloadBlob, tryDownloadDataUrl } from '@/utils/certExport'
import { shareChallenge } from '@/utils/share'
import { playTone } from '@/utils/sound'

const router = useRouter()
const route = useRoute()
const game = useGameStore()
const tip = ref('')
const downloading = ref(false)
const certRef = ref<HTMLElement | null>(null)
const previewUrl = ref('')
const showPreview = ref(false)
const inWeChat = isWeChat()

function syncCertQuery() {
  if (!game.userName) return
  const c = encodeCertSnapshot(game.buildCertSnapshot())
  if (route.query.c === c) return
  router.replace({ path: '/certificate', query: { c } })
}

onMounted(() => {
  game.hydrate()

  const raw = route.query.c
  if (typeof raw === 'string' && raw) {
    const snap = decodeCertSnapshot(raw)
    if (snap) {
      game.applyCertSnapshot(snap)
    }
  }

  if (!game.userName) {
    router.replace('/result')
    return
  }

  // 保证链接里带成绩，微信点「浏览器打开」不会丢数据
  syncCertQuery()

  if (inWeChat) {
    tip.value = '微信中请点「生成图片」后，长按图片保存到相册'
  }
})

async function share() {
  const c = encodeCertSnapshot(game.buildCertSnapshot())
  const url = buildCertShareUrl(c)
  const result = await shareChallenge(game.score, url)
  if (result === true) tip.value = '已调起系统分享'
  else if (result === 'copied') tip.value = '带成绩的证书链接已复制，可粘贴发送'
  else tip.value = '请复制地址栏链接分享（链接已包含成绩）'
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
      scale: Math.min(2.5, window.devicePixelRatio || 2),
      useCORS: true,
      logging: false,
    })
    const dataUrl = canvasToDataUrl(canvas)
    const safeName = (game.userName || '用户').replace(/[\\/:*?"<>|]/g, '')
    const filename = `火线行动证书-${safeName}.png`

    // 微信无法真正触发本地下载，改为预览长按保存
    if (inWeChat) {
      previewUrl.value = dataUrl
      showPreview.value = true
      tip.value = '请长按上方证书图片，选择「保存图片」'
      playTone('success', game.soundEnabled)
      return
    }

    let saved = false
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      )
      if (blob) saved = await tryDownloadBlob(blob, filename)
    } catch {
      saved = false
    }
    if (!saved) saved = tryDownloadDataUrl(dataUrl, filename)

    if (saved) {
      tip.value = '证书已开始下载；若未看到文件，请再点一次或截图保存'
      playTone('success', game.soundEnabled)
    } else {
      previewUrl.value = dataUrl
      showPreview.value = true
      tip.value = '当前浏览器限制自动下载，请长按图片保存'
      playTone('success', game.soundEnabled)
    }
  } catch {
    tip.value = '生成失败，请直接截图保存证书'
    playTone('wrong', game.soundEnabled)
  } finally {
    downloading.value = false
  }
}

function closePreview() {
  showPreview.value = false
}

function retry() {
  game.resetAll()
  router.push('/home')
}
</script>

<template>
  <div class="game-shell cert-page">
    <div class="page-top">
      <SoundToggle />
    </div>
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
          :label="downloading ? '生成中…' : inWeChat ? '生成图片并保存' : '下载证书图片'"
          :disabled="downloading"
          @click="downloadCert"
        />
        <GameButton block variant="ghost" label="分享挑战" @click="share" />
        <GameButton block variant="ghost" label="重新挑战" @click="retry" />
      </div>
      <p v-if="tip" class="tip">{{ tip }}</p>
      <p v-if="inWeChat" class="wechat-hint">
        若需在系统浏览器打开，请复制本页链接（已含成绩），不要直接从微信菜单打开空白页。
      </p>
    </div>

    <div v-if="showPreview" class="preview-mask" @click.self="closePreview">
      <div class="preview-sheet">
        <p class="preview-title">长按图片保存到相册</p>
        <img class="preview-img" :src="previewUrl" alt="证书预览" />
        <GameButton block label="关闭" @click="closePreview" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cert-page {
  padding: 20px 16px calc(28px + var(--safe-bottom));
}

.page-top {
  display: flex;
  justify-content: flex-end;
  max-width: 360px;
  margin: 0 auto 8px;
}

.wrap {
  position: relative;
  z-index: 1;
  max-width: 360px;
  margin: 0 auto;
}

.cert-capture {
  width: 100%;
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
  line-height: 1.5;
}

.wechat-hint {
  margin-top: 8px;
  text-align: center;
  color: #ffe082;
  font-size: 11px;
  line-height: 1.5;
}

.preview-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.72);
  display: grid;
  place-items: center;
  padding: 20px 16px;
}

.preview-sheet {
  width: min(100%, 380px);
  max-height: 90dvh;
  overflow: auto;
  padding: 14px;
  border-radius: 14px;
  background: #0f1c2b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  gap: 12px;
}

.preview-title {
  margin: 0;
  text-align: center;
  color: #ffe082;
  font-size: 14px;
  font-weight: 700;
}

.preview-img {
  width: 100%;
  border-radius: 8px;
  background: #efe9dc;
  /* 允许微信长按菜单 */
  -webkit-touch-callout: default;
  pointer-events: auto;
  user-select: none;
}
</style>
