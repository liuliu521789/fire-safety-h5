<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  rank: string
  duration: number
  userName: string
}>()

const dateText = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
})

const certNo = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const tail = String(Math.abs(props.score * 97 + props.duration * 13 + (props.userName?.length || 0) * 7))
    .padStart(4, '0')
    .slice(-4)
  return `XF-${y}${m}${day}-${tail}`
})

const rankTone = computed(() => {
  if (props.score >= 90) return 'gold'
  if (props.score >= 75) return 'blue'
  if (props.score >= 60) return 'teal'
  return 'silver'
})

const rankStops = computed(() => {
  switch (rankTone.value) {
    case 'gold':
      return [
        { offset: '0%', color: '#fff3b0' },
        { offset: '35%', color: '#f0d060' },
        { offset: '70%', color: '#c9a227' },
        { offset: '100%', color: '#7a5a08' },
      ]
    case 'blue':
      return [
        { offset: '0%', color: '#cfe5ff' },
        { offset: '35%', color: '#5babff' },
        { offset: '70%', color: '#1677ff' },
        { offset: '100%', color: '#0a2f70' },
      ]
    case 'teal':
      return [
        { offset: '0%', color: '#c9fff7' },
        { offset: '35%', color: '#4ee0ce' },
        { offset: '70%', color: '#1aa89a' },
        { offset: '100%', color: '#085249' },
      ]
    default:
      return [
        { offset: '0%', color: '#f2f5f8' },
        { offset: '35%', color: '#c5ced8' },
        { offset: '70%', color: '#7b8896' },
        { offset: '100%', color: '#3a4450' },
      ]
  }
})

const rankDepth = computed(() => {
  switch (rankTone.value) {
    case 'gold':
      return '#5c4306'
    case 'blue':
      return '#06224f'
    case 'teal':
      return '#043f38'
    default:
      return '#2a323b'
  }
})

const rankStroke = computed(() => {
  switch (rankTone.value) {
    case 'gold':
      return '#8a6508'
    case 'blue':
      return '#0d4ea8'
    case 'teal':
      return '#0f7a6e'
    default:
      return '#4a5562'
  }
})

const performanceText = computed(() => {
  if (props.score >= 90) return '已完成本次消防安全科普挑战全部关卡，综合表现优秀。'
  if (props.score >= 75) return '已完成本次消防安全科普挑战全部关卡，综合表现良好。'
  if (props.score >= 60) return '已完成本次消防安全科普挑战全部关卡，基本掌握相关知识，仍需继续巩固。'
  return '已完成本次消防安全科普挑战全部关卡，建议复习薄弱环节并再次练习。'
})
</script>

<template>
  <div class="cert" :class="`tone-${rankTone}`">
    <div class="cert-frame">
      <div class="corner tl" />
      <div class="corner tr" />
      <div class="corner bl" />
      <div class="corner br" />

      <!-- 中心五角星印章水印：独立元素避免伪元素/背景图裁切 -->
      <svg class="seal-mark" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#8b6d1a" stroke-width="2.2" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="#8b6d1a" stroke-width="1" />
        <path
          fill="#8b6d1a"
          d="M60 34 L65.9 51.9 L84.7 52 L69.5 63.1 L75.3 81 L60 70 L44.7 81 L50.5 63.1 L35.3 52 L54.1 51.9 Z"
        />
      </svg>

      <header class="head">
        <div class="emblem" aria-hidden="true">
          <svg class="medal" viewBox="0 0 64 72" role="img">
            <defs>
              <linearGradient :id="`medalFace-${rankTone}`" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stop-color="var(--medal-hi)" />
                <stop offset="45%" stop-color="var(--medal-mid)" />
                <stop offset="100%" stop-color="var(--medal-lo)" />
              </linearGradient>
              <linearGradient :id="`medalRibbonL-${rankTone}`" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#e85d5d" />
                <stop offset="100%" stop-color="#b71c1c" />
              </linearGradient>
              <linearGradient :id="`medalRibbonR-${rankTone}`" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f08a8a" />
                <stop offset="100%" stop-color="#c62828" />
              </linearGradient>
            </defs>
            <!-- 绶带 -->
            <path
              :fill="`url(#medalRibbonL-${rankTone})`"
              d="M22 2 L32 22 L26 22 L14 4 Z"
            />
            <path
              :fill="`url(#medalRibbonR-${rankTone})`"
              d="M42 2 L32 22 L38 22 L50 4 Z"
            />
            <path fill="#8b1515" d="M26 20h12l-2 8h-8z" opacity="0.85" />
            <!-- 奖牌外圈 -->
            <circle cx="32" cy="46" r="22" fill="#8b6d1a" opacity="0.35" />
            <circle cx="32" cy="45" r="20.5" :fill="`url(#medalFace-${rankTone})`" />
            <circle
              cx="32"
              cy="45"
              r="17"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              stroke-width="1.4"
            />
            <circle
              cx="32"
              cy="45"
              r="14.5"
              fill="none"
              stroke="rgba(0,0,0,0.18)"
              stroke-width="1"
            />
            <!-- 星形（圆心 32,45） -->
            <g transform="translate(32 45)">
              <path
                fill="#fff8e1"
                stroke="rgba(90,60,10,0.35)"
                stroke-width="0.6"
                stroke-linejoin="round"
                d="M0,-11 L2.47,-3.4 L10.46,-3.4 L3.99,1.3 L6.47,8.9 L0,4.2 L-6.47,8.9 L-3.99,1.3 L-10.46,-3.4 L-2.47,-3.4 Z"
              />
            </g>
          </svg>
        </div>
        <h2>火线行动证书</h2>
        <p class="sub">消防安全科普演练纪念</p>
        <p class="cert-no">证书编号：{{ certNo }}</p>
      </header>

      <div class="divider" aria-hidden="true"><i /></div>

      <section class="body">
        <p class="who">{{ userName || '用户' }}</p>

        <div class="doc">
          <p class="lead">
            {{ performanceText }}
          </p>
          <p class="lead-sub">经演练评定，综合评级为：</p>

          <div class="rank-line" aria-label="综合评级">
            <svg class="rank-svg" viewBox="0 0 360 88" role="img">
              <defs>
                <linearGradient :id="`rankGrad-${rankTone}`" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop
                    v-for="(stop, i) in rankStops"
                    :key="i"
                    :offset="stop.offset"
                    :stop-color="stop.color"
                  />
                </linearGradient>
                <linearGradient :id="`rankShine-${rankTone}`" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7" />
                  <stop offset="40%" stop-color="#ffffff" stop-opacity="0.12" />
                  <stop offset="100%" stop-color="#000000" stop-opacity="0.18" />
                </linearGradient>
                <filter :id="`rankSoft-${rankTone}`" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000000" flood-opacity="0.22" />
                </filter>
              </defs>
              <text
                x="182"
                y="58"
                text-anchor="middle"
                font-size="48"
                font-weight="900"
                letter-spacing="10"
                :fill="rankDepth"
                opacity="0.5"
              >
                {{ rank }}
              </text>
              <text
                x="180"
                y="56"
                text-anchor="middle"
                font-size="48"
                font-weight="900"
                letter-spacing="10"
                :fill="`url(#rankGrad-${rankTone})`"
                :filter="`url(#rankSoft-${rankTone})`"
                :stroke="rankStroke"
                stroke-width="1.2"
                paint-order="stroke fill"
              >
                {{ rank }}
              </text>
              <text
                x="180"
                y="56"
                text-anchor="middle"
                font-size="48"
                font-weight="900"
                letter-spacing="10"
                :fill="`url(#rankShine-${rankTone})`"
                opacity="0.45"
              >
                {{ rank }}
              </text>
            </svg>
          </div>
        </div>
      </section>

      <footer class="foot">
        <div class="sign-block">
          <p>火线行动 · 科普演练</p>
          <p>{{ dateText }}</p>
        </div>
        <p class="motto">创意赋能 · 守护你我</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.cert {
  position: relative;
  width: 100%;
  aspect-ratio: 210 / 297;
  padding: 2px;
  border-radius: 8px;
  background: var(--frame-grad);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
  --frame-grad: linear-gradient(145deg, #c9a227, #f0e2a0 35%, #8a6d1a 70%, #e8d48a);
  --accent: #0d4ea8;
  --emblem-grad: linear-gradient(160deg, #1677ff, #0d4ea8);
  --medal-hi: #fff3b0;
  --medal-mid: #e0b83a;
  --medal-lo: #9a7209;
}

.tone-gold {
  --frame-grad: linear-gradient(145deg, #d4af37, #fff1b0 32%, #a67c00 68%, #f3e0a0);
  --accent: #9a7209;
  --emblem-grad: linear-gradient(160deg, #f0d060, #c9a227 55%, #8b6914);
  --medal-hi: #fff3b0;
  --medal-mid: #e0b83a;
  --medal-lo: #9a7209;
}

.tone-blue {
  --frame-grad: linear-gradient(145deg, #3d8bfd, #b7d6ff 32%, #1554b0 68%, #9ec5ff);
  --accent: #0d4ea8;
  --emblem-grad: linear-gradient(160deg, #4ea1ff, #1677ff 55%, #0d4ea8);
  --medal-hi: #cfe5ff;
  --medal-mid: #3d8bfd;
  --medal-lo: #0d4ea8;
}

.tone-teal {
  --frame-grad: linear-gradient(145deg, #2bbbad, #b8f0e8 32%, #0f7a6e 68%, #9be6db);
  --accent: #0f7a6e;
  --emblem-grad: linear-gradient(160deg, #3dd6c3, #1aa89a 55%, #0f7a6e);
  --medal-hi: #c9fff7;
  --medal-mid: #2bbbad;
  --medal-lo: #0f7a6e;
}

.tone-silver {
  --frame-grad: linear-gradient(145deg, #9aa7b5, #e8eef4 32%, #5f6d7c 68%, #d5dde6);
  --accent: #4a5562;
  --emblem-grad: linear-gradient(160deg, #b7c2ce, #7b8896 55%, #4a5562);
  --medal-hi: #f2f5f8;
  --medal-mid: #9aa7b5;
  --medal-lo: #5f6d7c;
}

.cert-frame {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  padding: 5.5% 7% 4.5%;
  border-radius: 6px;
  color: #1a2433;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  background-color: #f8f5ed;
  background-image:
    radial-gradient(ellipse 72% 58% at 50% 44%, rgba(201, 162, 39, 0.08), transparent 68%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cpath d='M28 4L52 28 28 52 4 28Z' fill='none' stroke='%238b6d1a' stroke-opacity='0.07' stroke-width='0.9'/%3E%3Cpath d='M28 16L40 28 28 40 16 28Z' fill='none' stroke='%238b6d1a' stroke-opacity='0.045' stroke-width='0.7'/%3E%3Ccircle cx='28' cy='28' r='2.2' fill='%238b6d1a' fill-opacity='0.05'/%3E%3C/svg%3E"),
    linear-gradient(180deg, #f8f5ed 0%, #efe9dc 100%);
  background-size: auto, 56px 56px, auto;
  background-repeat: no-repeat, repeat, no-repeat;
  background-position: center, center, center;
}

.cert-frame::before {
  content: '';
  position: absolute;
  inset: 2.6%;
  z-index: 2;
  border: 1px solid rgba(139, 109, 26, 0.3);
  border-radius: 4px;
  pointer-events: none;
}

/* 中心浅水印：正圆框 + 几何居中五角星，留足描边边距避免裁切 */
.seal-mark {
  position: absolute;
  display: block;
  left: 50%;
  top: 50%;
  z-index: 0;
  width: 52%;
  height: auto;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0.09;
  overflow: visible;
}

.corner {
  position: absolute;
  z-index: 1;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(139, 109, 26, 0.48);
}

.tl {
  top: 3.6%;
  left: 3.6%;
  border-right: none;
  border-bottom: none;
}
.tr {
  top: 3.6%;
  right: 3.6%;
  border-left: none;
  border-bottom: none;
}
.bl {
  bottom: 3.6%;
  left: 3.6%;
  border-right: none;
  border-top: none;
}
.br {
  bottom: 3.6%;
  right: 3.6%;
  border-left: none;
  border-top: none;
}

.head {
  position: relative;
  z-index: 1;
  text-align: center;
  flex-shrink: 0;
}

.emblem {
  position: relative;
  width: 48px;
  height: 54px;
  margin: 0 auto 4px;
}

.medal {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.18));
}

h2 {
  margin: 6px 0 0;
  font-size: clamp(20px, 5.8vw, 26px);
  font-weight: 800;
  letter-spacing: 0.22em;
  color: #132033;
  line-height: 1.2;
}

.sub {
  margin: 4px 0 0;
  color: #8b6d1a;
  font-size: 10px;
  letter-spacing: 0.16em;
}

/* 公文文号 */
.cert-no {
  margin: 8px 0 0;
  text-align: center;
  color: #5c6b7a;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.divider {
  position: relative;
  z-index: 1;
  margin: 10px 0 14px;
  height: 1px;
  flex-shrink: 0;
  background: linear-gradient(90deg, transparent, rgba(139, 109, 26, 0.5), transparent);
}

.divider i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  transform: translate(-50%, -50%) rotate(45deg);
  background: #c9a227;
}

.body {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
}

.who {
  margin: 0 0 10px;
  text-align: center;
  color: var(--accent);
  font-size: clamp(20px, 6vw, 26px);
  font-weight: 800;
  letter-spacing: 0.2em;
  line-height: 1.25;
  flex-shrink: 0;
}

/* 公文正文：首行缩进，避免窄屏硬拆词 */
.doc {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.doc > p {
  margin: 0;
  color: #2a3648;
  font-size: clamp(12px, 3.6vw, 14px);
  line-height: 1.75;
  text-align: justify;
  text-justify: inter-ideograph;
}

.lead {
  text-indent: 2em;
}

.lead-sub {
  margin-top: 2px;
  text-indent: 2em;
}

.rank-line {
  margin: 12px 0 0;
  padding: 12px 8px;
  border-radius: 10px;
  border: 1px solid rgba(139, 109, 26, 0.18);
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.rank-svg {
  display: block;
  width: 100%;
  height: 64px;
  overflow: visible;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.foot {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  margin-top: auto;
  padding-top: 16px;
}

.sign-block {
  margin-left: auto;
  width: max-content;
  max-width: 100%;
  text-align: right;
}

.sign-block p {
  margin: 0 0 6px;
  color: #132033;
  font-size: clamp(12px, 3.4vw, 13px);
  line-height: 1.5;
  white-space: nowrap;
  letter-spacing: 0.08em;
}

.sign-block p:last-child {
  margin-bottom: 0;
  color: #5c6b7a;
  font-variant-numeric: tabular-nums;
}

.motto {
  margin: 16px 0 0;
  text-align: center;
  color: #8b6d1a;
  font-size: 10px;
  letter-spacing: 0.22em;
  line-height: 1.4;
}
</style>
