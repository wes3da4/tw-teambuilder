export type Role = 'tank' | 'heal' | 'dps' | 'free'

export interface Member {
  id: string
  name: string
  level: number
  role: Role
  chara: string
  absent: boolean
  memo: string
}

export interface Content {
  id: string
  name: string
  ptSize: number
  roles: { tank: number; heal: number; dps: number; free: number }
  memo: string
}

export interface AppState {
  contents: Content[]
  members: Member[]
  assignments: Record<string, Record<number, Record<number, string | null>>>
  ptCounts: Record<string, number>
  ptNames: Record<string, Record<number, string>>
  activeContentId: string | null
  showEta: boolean
}
