import type { Role } from './types'

export const CHARAS = [
  'ルシアン', 'ボリス', 'ティチエル', 'ミラ', 'イスピン', 'マキシミン',
  'ナヤトレイ', 'シベリン', 'ジョシュア', 'クロエ', 'ランジエ', 'イサック',
  'アナイス', 'イソレット', 'ベンヤ', 'ロアミニ', 'ノクターン', 'リーチェ', 'イェフネン',
] as const

export const CHARA_MAP: Record<string, string> = {
  'ルシアン': 'Char-Lucian.png',
  'ボリス': 'Char-Boris.png',
  'ティチエル': 'Char-Tichiel.png',
  'ミラ': 'Char-Mila.png',
  'イスピン': 'Char-Ispin.png',
  'マキシミン': 'Char-Maximin.png',
  'ナヤトレイ': 'Char-Maya.png',
  'シベリン': 'Char-Sivelin.png',
  'ジョシュア': 'Char-Josua.png',
  'クロエ': 'Char-Cloe.png',
  'ランジエ': 'Char-Lanziee.png',
  'イサック': 'Char-Issac.png',
  'アナイス': 'Char-Anais.png',
  'イソレット': 'Char-Isolet.png',
  'ベンヤ': 'Char-Benya.png',
  'ロアミニ': 'Char-Roamini.png',
  'ノクターン': 'Char-Nocturne.png',
  'リーチェ': 'Char-Rice.png',
  'イェフネン': 'Char-Yevgnen.png',
}

export const ROLE_ICON: Record<string, string> = {
  tank: `${import.meta.env.BASE_URL}icons/Role-Tank.png`,
  heal: `${import.meta.env.BASE_URL}icons/Role-Healer.png`,
  dps:  `${import.meta.env.BASE_URL}icons/Role-Attacker.png`,
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
