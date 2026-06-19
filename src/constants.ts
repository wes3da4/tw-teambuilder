import type { Role } from './types'

export const CHARAS = [
  'ルシアン', 'ボリス', 'ティチエル', 'ミラ', 'イスピン', 'マキシミン',
  'ナヤトレイ', 'シベリン', 'ジョシュア', 'クロエ', 'ランジエ', 'イサック',
  'アナイス', 'イソレット', 'ベンヤ', 'ロアミニ', 'ノクターン', 'リーチェ', 'イェフネン',
] as const

export const CHARA_MAP: Record<string, string> = {
  'ルシアン': 'char/Lucian.png',
  'ボリス': 'char/Boris.png',
  'ティチエル': 'char/Tichiel.png',
  'ミラ': 'char/Mila.png',
  'イスピン': 'char/Ispin.png',
  'マキシミン': 'char/Maximin.png',
  'ナヤトレイ': 'char/Naya.png',
  'シベリン': 'char/Sivelin.png',
  'ジョシュア': 'char/Josua.png',
  'クロエ': 'char/Cloe.png',
  'ランジエ': 'char/Lanziee.png',
  'イサック': 'char/Issac.png',
  'アナイス': 'char/Anais.png',
  'イソレット': 'char/Isolet.png',
  'ベンヤ': 'char/Benya.png',
  'ロアミニ': 'char/Roamini.png',
  'ノクターン': 'char/Nocturne.png',
  'リーチェ': 'char/Rice.png',
  'イェフネン': 'char/Yevgnen.png',
}

export const ROLE_ICON: Record<string, string> = {
  tank: `${import.meta.env.BASE_URL}icons/role/Tank.png`,
  heal: `${import.meta.env.BASE_URL}icons/role/Healer.png`,
  dps:  `${import.meta.env.BASE_URL}icons/role/Attacker.png`,
}

export const SLOT_ROLE_CLASS: Record<string, string> = {
  tank: 'slot-role-tank',
  heal: 'slot-role-heal',
  dps:  'slot-role-dps',
  free: 'slot-role-free',
}

export const ROLES: { value: Role; label: string }[] = [
  { value: 'tank', label: 'タンク' },
  { value: 'heal', label: 'ヒーラー' },
  { value: 'dps',  label: 'アタッカー' },
  { value: 'free', label: '指定なし' },
]
