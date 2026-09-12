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
  /** 答题后展示的详细科普解释 */
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
    knowledge:
      '正确答案是 D（119）。110 是报警（治安）、120 是急救、122 是交通事故报警，容易记混。发生火灾时应立即拨打 119，并尽量说清起火地点、火势和人员情况，方便消防力量快速出动。',
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
    knowledge:
      '正确答案是 A、B、C。报警重点是“在哪里、什么情况、怎么联系你”，让指挥中心能迅速派车。不必在电话里详细讲述起火原因和过程，那会耽误黄金救援时间；起火原因交由后续调查处理。',
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
    knowledge:
      '正确答案是 A。火场中塑料、装修材料等燃烧会产生一氧化碳等有毒烟气，多数遇难者其实是因吸入烟气昏迷后遇难，而不是直接被火烧到。逃生时要用湿毛巾捂口鼻、低姿前进，尽快离开烟气区域。',
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
    knowledge:
      '正确答案是 A。车载灭火器可用于扑救初起火灾，争取逃生和救援时间。打火机、喷雾罐等易燃品，以及大功率电器，在暴晒或线路故障时都可能成为起火源，不应长期放在车内。',
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
    knowledge:
      '正确答案是 C。消防车执行任务时争分夺秒，道路上的每一秒都可能关系到生命。听到警笛应主动减速靠右、停车让行，严禁占道、并排或强行超车，否则不仅违法，还会延误救援。',
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
    knowledge:
      '正确答案是 A、B。秸秆、柴草靠近房屋或灶台，一旦火星溅落极易连片起火。孩子玩火、独自被锁家中也是农村火灾常见诱因。柴草应远离灶台和厨房，并定期清理房屋周边可燃物。',
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
    knowledge:
      '正确答案是 B。电暖器表面温度很高，靠近床铺、窗帘、衣物可能烤燃起火；烘烤衣物、人走不断电同样危险。使用时应与可燃物保持一米以上距离，离开房间务必关闭电源。',
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
    knowledge:
      '正确答案是 B。儿童缺乏危险意识，玩火、乱动燃气灶都可能酿成悲剧。家长应反复告知危害，并把火柴、打火机等火种放在孩子够不到的地方，也不要让孩子单独操作明火器具。',
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
    knowledge:
      '正确答案是 A。卧床、沙发吸烟时人一旦睡着，烟头掉落即可引燃被褥。未完全熄灭的烟头扔进垃圾桶，也可能点燃纸屑。烟头必须掐灭确认无火星后，再放入烟灰缸。',
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
    knowledge:
      '正确答案是 A、D。电动车电池故障时可能剧烈燃烧，在家中、楼道充电一旦起火，烟气会迅速封堵逃生通道。应到集中充电点或室外开阔处充电，严禁飞线入户和楼道内充电。',
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
    knowledge:
      '正确答案是 A。全封闭防盗窗在火灾时会把人困在室内，救援和逃生都困难。选购时应选择带可开启逃生口的防盗窗，并确保钥匙或开启装置方便取用，关键时刻能迅速打开。',
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
    knowledge:
      '正确答案是 A、B、C。出租屋人员复杂、用电用火频繁，是火灾高发场所。房东应保证符合消防规定、配备灭火器等设施，并向租客说明疏散路线和安全注意事项，不能只看房屋质量而忽视消防。',
  },
  {
    id: 'fq13',
    prompt: '在电焊施工时，旁边是否可以放置废旧纸箱？',
    options: [
      { key: 'A', text: '可以' },
      { key: 'B', text: '不可以' },
    ],
    answer: ['B'],
    knowledge:
      '正确答案是 B。电焊会产生高温焊渣和飞溅火花，纸箱、木屑等可燃物被引燃后火势蔓延很快。动火作业必须清理现场可燃物，配备灭火器材，并安排看火人监护。',
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
    knowledge:
      '正确答案是 D。消防车通道是火灾救援的“生命通道”，私家车、电动车占用后，消防车无法靠近扑救，后果严重。通道上严禁停放任何车辆，发现占用应劝离或举报。',
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
    knowledge:
      '正确答案是 A。老化线路、松动接口、燃气软管破损都是隐患。平时应定期检查，离家、睡前关闭电源总闸不必要回路和燃气阀门，从源头降低夜间和无人时的火灾风险。',
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
    knowledge:
      '正确答案是 A。公共场所人多、路径复杂，火灾时烟气很快会让人看不清方向。养成进门先看安全出口和疏散指示的习惯，紧急情况下能更快找到生路，避免盲目跟跑或逆流。',
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
    knowledge:
      '正确答案是 A。初起火灾可用灭火器扑救：提拉握压（拔销、握把、对准、压把）。室内消火栓则需打开箱门、接水带水枪、开阀门出水。平时参加培训或演练，关键时刻才用得上。',
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
    knowledge:
      '正确答案是 A。灭火器、消火栓、烟感、喷淋和疏散指示灯都是身边的“保镖”。平时走一走记一记它们的位置，火灾初期才能第一时间取用器材、沿正确路线撤离。',
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
    knowledge:
      '正确答案是 B。燃气遇电火花可能爆炸，开灯、打电话、开关电器都很危险。应迅速关闭气源阀门（若可安全操作）、疏散人员、打开门窗通风，到室外安全地点后再报警。',
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
    knowledge:
      '正确答案是 B、C。油锅着火时泼水会爆溅，火势反而扩大。正确做法是迅速盖上锅盖或用灭火毯覆盖隔绝空气，并关闭燃气；千万不要端起油锅乱跑。',
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
    knowledge:
      '正确答案是 A。火势猛烈时，滞留抢救财物或盲目扑打都会让人吸入烟气、错过逃生窗口。应立即沿疏散路线撤离，到安全区域后再报警，生命永远优先于财产。',
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
    knowledge:
      '正确答案是 C。高层被困时强行冲火极易遇难。应关闭通向火场的门窗、用湿毛巾堵缝，退到阳台或窗边，用灯光、衣物、呼救等方式发出明显信号，等待消防救援，切勿盲目跳楼。',
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
    knowledge:
      '正确答案是 A、B、C。家用手提灭火器可应对初起火；缓降器/逃生绳、手电筒和防烟面罩有助于撤离。水枪水带属于专业消防装备，家庭一般不具备接口和操作条件，不必强行配备。',
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
    knowledge:
      '正确答案是 A、B、C。堵塞出口通道、损坏挪用消火栓灭火器等，会直接导致火灾时无法逃生和扑救，属于消防违法。无照经营主要涉及市场监管等其他法规，不是本题所指的消防违法行为。',
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
    knowledge:
      '正确答案是 A、B、C、D。这是单位消防“四个能力”的基本要求：会查隐患、会报警、会扑救初起火灾、会逃生和组织疏散。开消防车属于消防专业人员职责，不是普通员工培训目标。',
  },
]

export const ESCAPE_QUIZ_COUNT = 3

export function isMultiQuestion(q: EscapeQuestion) {
  return q.answer.length > 1 || /（多选）|【多选】/.test(q.prompt)
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

/** 格式化正确答案展示，如 A、B、C */
export function formatAnswerKeys(keys: string[]) {
  return [...keys].sort().join('、')
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
