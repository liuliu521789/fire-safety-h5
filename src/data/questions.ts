export interface EscapeOption {
  key: string
  text: string
}

export interface EscapeQuestion {
  id: string
  prompt: string
  options: EscapeOption[]
  /** 正确答案，如 ['D'] 或 ['A','B','C'] */
  answer: string[]
  knowledge: string
}

/** 消防安全知识题库：每次开局随机抽取 */
export const ESCAPE_QUESTION_BANK: EscapeQuestion[] = [
  {
    id: 'fq1',
    prompt: '请问我国火灾报警电话号码是什么？',
    options: [
      { key: 'A', text: '110' },
      { key: 'B', text: '122' },
      { key: 'C', text: '120' },
      { key: 'D', text: '119' },
    ],
    answer: ['D'],
    knowledge: '我国火警电话是 119，应牢记并正确拨打。',
  },
  {
    id: 'fq2',
    prompt: '拨打火灾电话时，必须讲清楚以下哪些内容？（多选）',
    options: [
      { key: 'A', text: '起火单位和场所的详细地址' },
      { key: 'B', text: '火灾基本情况' },
      { key: 'C', text: '报警人姓名、单位及电话号码等相关信息' },
      { key: 'D', text: '详细讲解引起火灾的过程' },
    ],
    answer: ['A', 'B', 'C'],
    knowledge: '报警应说清地点、火情和联系方式，不必详细描述起火过程。',
  },
  {
    id: 'fq3',
    prompt: '火灾致人死亡的最主要原因是？',
    options: [
      { key: 'A', text: '有毒烟气' },
      { key: 'B', text: '拥挤踩踏' },
      { key: 'C', text: '火场高温' },
      { key: 'D', text: '跳楼或惊吓' },
    ],
    answer: ['A'],
    knowledge: '火灾中多数遇难者死于吸入有毒烟气，逃生时务必做好防烟。',
  },
  {
    id: 'fq4',
    prompt: '为了避免发生汽车火灾，您应当在车上放置什么？',
    options: [
      { key: 'A', text: '灭火器' },
      { key: 'B', text: '气体打火机、空气清新剂等易燃物品' },
      { key: 'C', text: '大功率的电器设备' },
    ],
    answer: ['A'],
    knowledge: '车上应配备灭火器，不要存放易燃物品或大功率电器。',
  },
  {
    id: 'fq5',
    prompt: '路上遇到鸣笛行驶的消防车，您应该怎么做？',
    options: [
      { key: 'A', text: '只管自己开车，无视他' },
      { key: 'B', text: '竞速，超过应急车辆' },
      { key: 'C', text: '主动减速、停车或让道' },
    ],
    answer: ['C'],
    knowledge: '遇消防车等应急车辆应主动让行，保障救援通道畅通。',
  },
  {
    id: 'fq6',
    prompt: '在农村日常生活中，以下哪一项做法是正确的？（多选）',
    options: [
      { key: 'A', text: '房屋周围不堆放秸秆、麦草等易燃物' },
      { key: 'B', text: '教育孩子不玩火，外出时，不将孩子单独锁在家中' },
      { key: 'C', text: '为了方便，将大量柴草堆放在灶台和厨房周围' },
    ],
    answer: ['A', 'B'],
    knowledge: '柴草远离灶台，教育孩子不玩火，不把孩子单独锁在家中。',
  },
  {
    id: 'fq7',
    prompt: '家中使用电暖器时，以下哪个做法是正确的？',
    options: [
      { key: 'A', text: '发热时尽量靠近床铺和人体' },
      { key: 'B', text: '离床铺、窗帘、沙发等可燃物要保持一米以上的距离' },
      { key: 'C', text: '近距离烘烤刚洗好的衣物' },
      { key: 'D', text: '出门时不关闭不断电' },
    ],
    answer: ['B'],
    knowledge: '电暖器应远离可燃物，出门时关闭断电。',
  },
  {
    id: 'fq8',
    prompt: '家长要教育孩子不玩火。以下哪一项是正确的？',
    options: [
      { key: 'A', text: '教孩子学会如何使用火柴' },
      { key: 'B', text: '告诉孩子玩火的危害，并将火柴、打火机放在孩子够不到的地方' },
      { key: 'C', text: '让孩子尝试自己用燃气灶烹饪食物' },
    ],
    answer: ['B'],
    knowledge: '要告知玩火危害，并将火种放在孩子够不到的地方。',
  },
  {
    id: 'fq9',
    prompt: '对吸烟人士而言，以下哪种行为最正确？',
    options: [
      { key: 'A', text: '不卧床吸烟，不乱扔烟头' },
      { key: 'B', text: '抽完烟把烟头直接扔垃圾桶' },
      { key: 'C', text: '只要在床头或茶几上摆上烟灰缸，可以躺在床上或沙发上吸烟' },
    ],
    answer: ['A'],
    knowledge: '不卧床吸烟、不乱扔烟头，烟头须完全熄灭。',
  },
  {
    id: 'fq10',
    prompt: '为了避免发生火灾，电动自行车可以在哪里充电？（多选）',
    options: [
      { key: 'A', text: '集中的充电点' },
      { key: 'B', text: '走道或楼梯间' },
      { key: 'C', text: '自己家中' },
      { key: 'D', text: '室外开阔处' },
    ],
    answer: ['A', 'D'],
    knowledge: '电动车应在集中充电点或室外开阔处充电，严禁在家中、楼道充电。',
  },
  {
    id: 'fq11',
    prompt: '在家庭装修时，您会选带逃生门的防盗窗吗？',
    options: [
      { key: 'A', text: '会' },
      { key: 'B', text: '不会' },
      { key: 'C', text: '无所谓' },
    ],
    answer: ['A'],
    knowledge: '防盗窗应预留逃生口，保障紧急情况下可撤离。',
  },
  {
    id: 'fq12',
    prompt: '您认为出租房屋时，应具备哪些条件？（多选）',
    options: [
      { key: 'A', text: '符合出租房消防安全管理规定' },
      { key: 'B', text: '配备完善的消防设施' },
      { key: 'C', text: '告知租客相关消防安全知识' },
      { key: 'D', text: '什么都不用做，房屋只要安全质量好就行' },
    ],
    answer: ['A', 'B', 'C'],
    knowledge: '出租房屋须符合消防规定，配备设施并告知租客安全知识。',
  },
  {
    id: 'fq13',
    prompt: '在电焊施工时，旁边是否可以放置废旧纸箱？',
    options: [
      { key: 'A', text: '可以' },
      { key: 'B', text: '不可以' },
    ],
    answer: ['B'],
    knowledge: '动火作业现场严禁堆放纸箱等可燃物。',
  },
  {
    id: 'fq14',
    prompt: '在消防车通道，您认为可以停放私家车吗？那电动自行车呢？',
    options: [
      { key: 'A', text: '都可以' },
      { key: 'B', text: '可以停私家车，不可以停电动自行车' },
      { key: 'C', text: '不可以停私家车，可以停电动自行车' },
      { key: 'D', text: '都不可以' },
    ],
    answer: ['D'],
    knowledge: '消防车通道严禁停放任何车辆，包括电动自行车。',
  },
  {
    id: 'fq15',
    prompt: '您有没有检查家中电器线路、燃气管道的习惯？离家前，是否有关闭的习惯？',
    options: [
      { key: 'A', text: '会检查，会关闭' },
      { key: 'B', text: '会检查，不关闭' },
      { key: 'C', text: '不检查，会关闭' },
      { key: 'D', text: '不检查，不关闭' },
    ],
    answer: ['A'],
    knowledge: '应定期检查线路与燃气管道，离家前关闭电源气源。',
  },
  {
    id: 'fq16',
    prompt: '当您进入商场、宾馆时，是否应当关注安全出口的位置？',
    options: [
      { key: 'A', text: '经常关注' },
      { key: 'B', text: '有时关注' },
      { key: 'C', text: '从不关注' },
    ],
    answer: ['A'],
    knowledge: '进入公共场所应先留意安全出口位置，以备紧急撤离。',
  },
  {
    id: 'fq17',
    prompt: '你会使用灭火器吗？那室内消火栓呢？',
    options: [
      { key: 'A', text: '都会' },
      { key: 'B', text: '会用灭火器，不会用室内消火栓' },
      { key: 'C', text: '不会用灭火器，会用室内消火栓' },
      { key: 'D', text: '都不会' },
    ],
    answer: ['A'],
    knowledge: '应学会正确使用灭火器和室内消火栓，提高自救互救能力。',
  },
  {
    id: 'fq18',
    prompt: '您是否知道您家庭或办公楼等周围的消防设施？',
    options: [
      { key: 'A', text: '知道' },
      { key: 'B', text: '不知道，没有留意过' },
      { key: 'C', text: '周围就没有消防设施' },
    ],
    answer: ['A'],
    knowledge: '了解身边消防设施位置，关键时刻才能快速使用。',
  },
  {
    id: 'fq19',
    prompt: '发现家中燃气大量泄漏时，您应该怎么做？',
    options: [
      { key: 'A', text: '迅速开灯查看' },
      { key: 'B', text: '疏散人员并开窗通风' },
      { key: 'C', text: '在现场拨打手机报警' },
    ],
    answer: ['B'],
    knowledge: '燃气泄漏时严禁开关电器，应疏散、通风，到安全处再报警。',
  },
  {
    id: 'fq20',
    prompt: '发现家中油锅着火时，以下哪些做法是正确的？（多选）',
    options: [
      { key: 'A', text: '立即向锅内大量泼水' },
      { key: 'B', text: '用灭火毯盖到油锅上' },
      { key: 'C', text: '盖上锅盖并关闭燃气开关' },
    ],
    answer: ['B', 'C'],
    knowledge: '油锅着火不可泼水，应用锅盖或灭火毯覆盖并关闭气源。',
  },
  {
    id: 'fq21',
    prompt: '如家中发生火灾，且火势猛烈，您应该怎么办？',
    options: [
      { key: 'A', text: '迅速疏散逃生' },
      { key: 'B', text: '抢救值钱物品' },
      { key: 'C', text: '抓紧扑打火焰' },
    ],
    answer: ['A'],
    knowledge: '火势猛烈时应迅速逃生，不要因财物延误撤离。',
  },
  {
    id: 'fq22',
    prompt: '假如您身处20楼，又被大火围困，您认为该怎么办？',
    options: [
      { key: 'A', text: '自行灭火' },
      { key: 'B', text: '冲进火海，寻找逃生路线' },
      { key: 'C', text: '可用打手电筒、挥舞衣物、呼叫等方式向窗外发送求救信号、等待救援' },
    ],
    answer: ['C'],
    knowledge: '高层被困时应固守待援，向外发送明显求救信号。',
  },
  {
    id: 'fq23',
    prompt: '家庭宜配备以下哪些消防器材？（多选）',
    options: [
      { key: 'A', text: '手提式灭火器' },
      { key: 'B', text: '救生缓降器或逃生绳' },
      { key: 'C', text: '强光手电筒、简易防烟面罩' },
      { key: 'D', text: '消防水枪、水带' },
    ],
    answer: ['A', 'B', 'C'],
    knowledge: '家庭宜配备灭火器、逃生绳（缓降器）、手电筒和防烟面罩等。',
  },
  {
    id: 'fq24',
    prompt: '下列哪些行为是消防违法行为？（多选）',
    options: [
      { key: 'A', text: '占用、堵塞、封闭消防安全出口、疏散通道和消防车通道' },
      { key: 'B', text: '圈占、埋压、损坏、挪用、遮挡消防设施和器材' },
      { key: 'C', text: '损坏公共消防设施' },
      { key: 'D', text: '无照经营' },
    ],
    answer: ['A', 'B', 'C'],
    knowledge: '堵塞通道、损坏挪用消防设施等均属消防违法，应坚决杜绝。',
  },
  {
    id: 'fq25',
    prompt: '单位要对员工进行消防安全培训，使每位员工具备以下能力？（多选）',
    options: [
      { key: 'A', text: '会检查和消除火灾隐患' },
      { key: 'B', text: '会报火警' },
      { key: 'C', text: '会扑救初起火灾' },
      { key: 'D', text: '会逃生自救，人员密集场所工作人员会组织人员疏散逃生' },
      { key: 'E', text: '会开消防车' },
    ],
    answer: ['A', 'B', 'C', 'D'],
    knowledge: '员工应做到会查隐患、会报警、会扑救初起火灾、会逃生自救。',
  },
]

export const ESCAPE_QUIZ_COUNT = 3

export function isMultiQuestion(q: EscapeQuestion) {
  return q.answer.length > 1
}

function sameAnswers(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

export function checkEscapeAnswer(q: EscapeQuestion, selected: string[]) {
  return sameAnswers(q.answer, selected)
}

/** 从题库中随机抽取不重复题目 */
export function pickEscapeQuestions(count = ESCAPE_QUIZ_COUNT): EscapeQuestion[] {
  const pool = [...ESCAPE_QUESTION_BANK]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return pool.slice(0, Math.min(count, pool.length))
}
