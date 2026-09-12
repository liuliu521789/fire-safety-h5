<script setup lang="ts">
import { computed } from 'vue'
import { formatTime, scoreLabel } from '@/utils/game'

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

const grade = computed(() => scoreLabel(props.score))

/** 按等级切换荣誉称号字体渐变色 */
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
</script>

<template>
  <div class="cert" :class="`tone-${rankTone}`">
    <div class="cert-frame">
      <div class="corner tl" />
      <div class="corner tr" />
      <div class="corner bl" />
      <div class="corner br" />

      <header class="head">
        <div class="emblem" aria-hidden="true">
          <span class="emblem-ring" />
          <span class="emblem-core"><i>安</i></span>
        </div>
        <p class="org">火线行动 · 消防安全知识挑战</p>
        <h2>消防安全证书</h2>
        <p class="sub">FIRE SAFETY CERTIFICATE</p>
        <p class="no">证书编号：{{ certNo }}</p>
      </header>

      <div class="divider"><i /></div>

      <section class="body">
        <p class="statement">兹证明</p>
        <p class="who-line">
          <span class="who">{{ userName || '用户' }}</span>
        </p>
        <p class="statement tail">
          已完成《火线行动：消防安全挑战》全部任务，综合表现评定如下：
        </p>

        <div class="rank-banner">
          <p class="rank-label">荣誉称号</p>
          <div class="rank-title-wrap" aria-label="荣誉称号">
            <svg class="rank-svg" viewBox="0 0 360 72" role="img">
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
                  <stop offset="38%" stop-color="#ffffff" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
                </linearGradient>
                <filter :id="`rankSoft-${rankTone}`" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.28" />
                </filter>
              </defs>

              <!-- 立体底层阴影 -->
              <text
                class="rank-depth"
                x="182"
                y="50"
                text-anchor="middle"
                font-size="42"
                font-weight="900"
                letter-spacing="6"
                :fill="rankDepth"
              >
                {{ rank }}
              </text>
              <text
                class="rank-depth"
                x="181"
                y="49"
                text-anchor="middle"
                font-size="42"
                font-weight="900"
                letter-spacing="6"
                :fill="rankDepth"
                opacity="0.55"
              >
                {{ rank }}
              </text>

              <!-- 主体渐变字 -->
              <text
                x="180"
                y="48"
                text-anchor="middle"
                font-size="42"
                font-weight="900"
                letter-spacing="6"
                :fill="`url(#rankGrad-${rankTone})`"
                :filter="`url(#rankSoft-${rankTone})`"
                :stroke="rankStroke"
                stroke-width="1.2"
                paint-order="stroke fill"
              >
                {{ rank }}
              </text>

              <!-- 高光层，增强立体感 -->
              <text
                x="180"
                y="48"
                text-anchor="middle"
                font-size="42"
                font-weight="900"
                letter-spacing="6"
                :fill="`url(#rankShine-${rankTone})`"
                opacity="0.55"
              >
                {{ rank }}
              </text>
            </svg>
          </div>
        </div>

        <div class="score-row">
          <div class="cell">
            <label>综合得分</label>
            <b class="score-num">{{ score }}</b>
          </div>
          <div class="cell">
            <label>评定等级</label>
            <b>{{ grade }}</b>
          </div>
        </div>

        <ul class="meta">
          <li>
            <span>完成用时</span>
            <b>{{ formatTime(duration) }}</b>
          </li>
          <li>
            <span>颁发日期</span>
            <b>{{ dateText }}</b>
          </li>
        </ul>
      </section>

      <footer class="foot">
        <div class="sign">
          <p>颁发单位</p>
          <b>火线行动</b>
        </div>
        <div class="seal">
          <span>安全认证</span>
        </div>
      </footer>

      <p class="motto">创意赋能 · 守护你我</p>
    </div>
  </div>
</template>

<style scoped>
.cert {
  position: relative;
  padding: 2px;
  border-radius: 8px;
  background: var(--frame-grad);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  --frame-grad: linear-gradient(145deg, #c9a227, #f0e2a0 35%, #8a6d1a 70%, #e8d48a);
  --rank-grad: linear-gradient(120deg, #b8860b, #e6c35c 40%, #8b6914);
  --accent: #0d4ea8;
  --emblem-grad: linear-gradient(160deg, #1677ff, #0d4ea8);
}

.tone-gold {
  --frame-grad: linear-gradient(145deg, #d4af37, #fff1b0 32%, #a67c00 68%, #f3e0a0);
  --rank-grad: linear-gradient(120deg, #9a7209, #f0d060 45%, #c9a227 75%, #7a5a08);
  --accent: #9a7209;
  --emblem-grad: linear-gradient(160deg, #f0d060, #c9a227 55%, #8b6914);
}

.tone-blue {
  --frame-grad: linear-gradient(145deg, #3d8bfd, #b7d6ff 32%, #1554b0 68%, #9ec5ff);
  --rank-grad: linear-gradient(120deg, #0b3d91, #4ea1ff 45%, #1677ff 75%, #0a2f70);
  --accent: #0d4ea8;
  --emblem-grad: linear-gradient(160deg, #4ea1ff, #1677ff 55%, #0d4ea8);
}

.tone-teal {
  --frame-grad: linear-gradient(145deg, #2bbbad, #b8f0e8 32%, #0f7a6e 68%, #9be6db);
  --rank-grad: linear-gradient(120deg, #0b6b5f, #3dd6c3 45%, #1aa89a 75%, #085249);
  --accent: #0f7a6e;
  --emblem-grad: linear-gradient(160deg, #3dd6c3, #1aa89a 55%, #0f7a6e);
}

.tone-silver {
  --frame-grad: linear-gradient(145deg, #9aa7b5, #e8eef4 32%, #5f6d7c 68%, #d5dde6);
  --rank-grad: linear-gradient(120deg, #4a5562, #b7c2ce 45%, #7b8896 75%, #3a4450);
  --accent: #4a5562;
  --emblem-grad: linear-gradient(160deg, #b7c2ce, #7b8896 55%, #4a5562);
}

.cert-frame {
  position: relative;
  padding: 22px 18px 16px;
  border-radius: 6px;
  background: linear-gradient(180deg, #f7f4ec 0%, #efe9dc 100%);
  color: #1a2433;
  overflow: hidden;
}

.cert-frame::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(139, 109, 26, 0.35);
  border-radius: 4px;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(139, 109, 26, 0.55);
  z-index: 1;
}

.tl {
  top: 12px;
  left: 12px;
  border-right: none;
  border-bottom: none;
}
.tr {
  top: 12px;
  right: 12px;
  border-left: none;
  border-bottom: none;
}
.bl {
  bottom: 12px;
  left: 12px;
  border-right: none;
  border-top: none;
}
.br {
  bottom: 12px;
  right: 12px;
  border-left: none;
  border-top: none;
}

.head {
  position: relative;
  z-index: 1;
  text-align: center;
}

.emblem {
  position: relative;
  width: 56px;
  height: 56px;
  margin: 0 auto 10px;
}

.emblem-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #8b6d1a;
  box-shadow: inset 0 0 0 3px rgba(201, 162, 39, 0.25);
}

.emblem-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 36px;
  height: 36px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--emblem-grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emblem-core i {
  font-style: normal;
  font-weight: 800;
  font-size: 18px;
  line-height: 1;
  display: block;
  transform: translateY(0.5px);
}

.org {
  color: #5c6b7a;
  font-size: 12px;
  letter-spacing: 0.08em;
}

h2 {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #132033;
}

.sub {
  margin-top: 4px;
  color: #8b6d1a;
  font-size: 11px;
  letter-spacing: 0.16em;
}

.no {
  margin-top: 8px;
  color: #6a7785;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.divider {
  position: relative;
  z-index: 1;
  margin: 14px 8px 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 109, 26, 0.55), transparent);
}

.divider i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%) rotate(45deg);
  background: #c9a227;
}

.body {
  position: relative;
  z-index: 1;
  padding: 0 4px;
}

.statement {
  color: #3a4a5c;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

.statement.tail {
  margin-top: 8px;
  text-align: justify;
}

.who-line {
  margin-top: 6px;
  text-align: center;
}

.who {
  display: inline-block;
  min-width: 4em;
  padding: 0 10px 4px;
  color: var(--accent);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.08em;
  background-image: linear-gradient(var(--accent), var(--accent));
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 100% 2px;
}

.rank-banner {
  margin: 16px 0 12px;
  padding: 14px 8px 10px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid rgba(139, 109, 26, 0.22);
  background: rgba(255, 255, 255, 0.55);
}

.rank-label {
  color: #6a7785;
  font-size: 12px;
  letter-spacing: 0.16em;
}

.rank-title-wrap {
  margin-top: 4px;
}

.rank-svg {
  display: block;
  width: 100%;
  height: 68px;
  overflow: visible;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.score-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cell {
  padding: 12px 10px;
  text-align: center;
  border: 1px solid rgba(139, 109, 26, 0.22);
  background: rgba(255, 255, 255, 0.5);
}

.cell label {
  display: block;
  color: #6a7785;
  font-size: 11px;
}

.cell b {
  display: block;
  margin-top: 4px;
  color: #132033;
  font-size: 18px;
}

.score-num {
  color: var(--accent) !important;
  font-size: 28px !important;
  font-variant-numeric: tabular-nums;
}

.meta {
  list-style: none;
  margin-top: 12px;
  border: 1px solid rgba(139, 109, 26, 0.22);
  background: rgba(255, 255, 255, 0.4);
}

.meta li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(139, 109, 26, 0.15);
  font-size: 13px;
}

.meta li:last-child {
  border-bottom: none;
}

.meta span {
  color: #6a7785;
}

.meta b {
  color: #132033;
  font-variant-numeric: tabular-nums;
}

.foot {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 4px 4px;
}

.sign p {
  color: #6a7785;
  font-size: 11px;
}

.sign b {
  display: block;
  margin-top: 16px;
  padding-top: 6px;
  min-width: 120px;
  border-top: 1px solid rgba(26, 36, 51, 0.35);
  color: #132033;
  font-size: 13px;
}

.seal {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid rgba(196, 48, 43, 0.75);
  color: rgba(196, 48, 43, 0.82);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  transform: rotate(-16deg);
  background: radial-gradient(circle, rgba(196, 48, 43, 0.06), transparent 65%);
  box-shadow: inset 0 0 0 5px rgba(196, 48, 43, 0.12);
}

.motto {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  text-align: center;
  color: #8b6d1a;
  font-size: 11px;
  letter-spacing: 0.2em;
}
</style>
