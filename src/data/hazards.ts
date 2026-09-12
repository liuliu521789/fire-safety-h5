export interface HazardItem {
  id: string
  label: string
  description: string
  tip: string
  /** 热点中心位置（相对场景百分比） */
  x: number
  y: number
  /** 可点击热区宽高（相对场景百分比） */
  w: number
  h: number
  zone: '客厅' | '厨房' | '阳台'
}

export const HAZARDS: HazardItem[] = [
  {
    id: 'exit',
    label: '安全出口被杂物堵塞',
    description:
      '安全出口或疏散通道被杂物堵塞，火灾发生时人员无法迅速逃生，后果严重。',
    tip: '疏散通道与安全出口必须保持畅通，严禁堆放杂物。',
    x: 16,
    y: 36,
    w: 15,
    h: 38,
    zone: '客厅',
  },
  {
    id: 'socket',
    label: '插线板超负荷使用',
    description:
      '多个大功率电器同时接入同一插线板，可能造成线路过热，增加火灾风险。',
    tip: '避免插线板超负荷，大功率电器应单独插座供电。',
    x: 34,
    y: 68,
    w: 16,
    h: 12,
    zone: '客厅',
  },
  {
    id: 'cigarette',
    label: '未熄灭烟头',
    description:
      '烟头未完全熄灭即随手丢放，余温可引燃沙发、地毯、纸张等可燃物。',
    tip: '烟头必须完全熄灭后再放入烟灰缸，切勿乱扔。',
    x: 24,
    y: 72,
    w: 11,
    h: 11,
    zone: '客厅',
  },
  {
    id: 'stove',
    label: '燃气灶附近堆放可燃杂物',
    description:
      '燃气灶附近堆放快递纸箱等可燃杂物，一旦灶火外溢或漏气，极易被引燃。',
    tip: '灶台周围应保持清洁，可燃物品远离明火与气源。',
    x: 68,
    y: 38,
    w: 16,
    h: 14,
    zone: '厨房',
  },
  {
    id: 'ebike',
    label: '电动车室内充电',
    description:
      '电动车在室内充电，一旦电池故障或线路过热，极易引发火灾并迅速蔓延。',
    tip: '电动车切勿在室内、楼道充电，应在指定充电区域进行。',
    x: 82,
    y: 68,
    w: 26,
    h: 36,
    zone: '阳台',
  },
]
