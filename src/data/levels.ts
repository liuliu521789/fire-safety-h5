export interface LevelMeta {
  id: number
  key: 'hazard' | 'escape' | 'extinguisher' | 'alarm' | 'rescue'
  code: string
  title: string
  maxScore: number
  route: string
}

export const LEVELS: LevelMeta[] = [
  {
    id: 1,
    key: 'hazard',
    code: '01',
    title: '隐患排查',
    maxScore: 20,
    route: '/level/hazard',
  },
  {
    id: 2,
    key: 'escape',
    code: '02',
    title: '火场逃生',
    maxScore: 20,
    route: '/level/escape',
  },
  {
    id: 3,
    key: 'extinguisher',
    code: '03',
    title: '初起灭火',
    maxScore: 20,
    route: '/level/extinguisher',
  },
  {
    id: 4,
    key: 'alarm',
    code: '04',
    title: '紧急报警',
    maxScore: 15,
    route: '/level/alarm',
  },
  {
    id: 5,
    key: 'rescue',
    code: '05',
    title: '火线救援',
    maxScore: 25,
    route: '/level/rescue',
  },
]

export const TOTAL_SCORE = 100
